import { prisma } from "@/lib/db";
import {
  requireWeddingAccess,
  requireManagerAnalyticsFeature,
  enforceUserRateLimit,
  errorResponse,
} from "@/lib/auth/guards";
import { toReais } from "@/lib/money";
import type { AnalyticsPayload } from "@/types/api";

type Params = { params: Promise<{ id: string }> };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireWeddingAccess(id);
    await requireManagerAnalyticsFeature(id);
    // Agregação analítica é pesada: cota por plano por usuário.
    const limited = await enforceUserRateLimit(userId, "analytics");
    if (limited) return limited;

    const [rsvpGroups, confirmations, expenseTotals, expenses] = await Promise.all([
      prisma.guest.groupBy({
        by: ["rsvpStatus"],
        where: { weddingId: id },
        _count: { _all: true },
      }),
      // updatedAt do convidado confirmado ≈ momento da confirmação (RSVP é a
      // última escrita típica no registro; aproximação documentada).
      prisma.guest.findMany({
        where: { weddingId: id, rsvpStatus: "confirmed" },
        select: { updatedAt: true },
        orderBy: { updatedAt: "asc" },
      }),
      prisma.expense.aggregate({
        where: { weddingId: id },
        _sum: { amount: true, paid: true },
      }),
      // Prisma não compara colunas entre si no where (paid < amount), então
      // atraso e pendências por categoria são reduzidos aqui no backend.
      prisma.expense.findMany({
        where: { weddingId: id },
        select: { category: true, amount: true, paid: true, dueDate: true, createdAt: true },
      }),
    ]);

    const rsvpCount = (status: string) =>
      rsvpGroups.find((g) => g.rsvpStatus === status)?._count._all ?? 0;
    const rsvp = {
      confirmed: rsvpCount("confirmed"),
      pending: rsvpCount("pending"),
      declined: rsvpCount("declined"),
      maybe: rsvpCount("maybe"),
      total: rsvpGroups.reduce((sum, g) => sum + g._count._all, 0),
    };

    const now = new Date();
    const payload: AnalyticsPayload = {
      rsvp,
      engagementTimeline: buildEngagementTimeline(
        confirmations.map((c) => c.updatedAt),
        rsvp.total,
        now,
      ),
      finance: {
        plannedCents: expenseTotals._sum.amount ?? 0,
        paidCents: expenseTotals._sum.paid ?? 0,
        overdueCents: expenses
          .filter((e) => e.dueDate && e.dueDate < now && e.paid < e.amount)
          .reduce((sum, e) => sum + (e.amount - e.paid), 0),
      },
      costTimeline: buildCostTimeline(expenses),
      vendors: buildVendors(expenses),
    };

    return Response.json(payload);
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Série semanal desde a primeira confirmação: confirmados acumulados e
 * pendentes = total - acumulado (aproximação retroativa do funil).
 */
function buildEngagementTimeline(
  confirmedAt: Date[],
  totalGuests: number,
  now: Date,
): AnalyticsPayload["engagementTimeline"] {
  const first = confirmedAt[0];
  if (!first) return [];
  const start = first.getTime();
  const weeks = Math.min(Math.floor((now.getTime() - start) / WEEK_MS) + 1, 12);
  return Array.from({ length: weeks }, (_, i) => {
    const cutoff = start + (i + 1) * WEEK_MS;
    const confirmados = confirmedAt.filter((d) => d.getTime() < cutoff).length;
    return {
      week: `Sem ${i + 1}`,
      confirmados,
      pendentes: Math.max(totalGuests - confirmados, 0),
    };
  });
}

type ExpenseRow = { category: string; amount: number; paid: number; dueDate: Date | null; createdAt: Date };

/** Acumulado mensal (mês do vencimento, ou do lançamento se sem dueDate), em reais. */
function buildCostTimeline(expenses: ExpenseRow[]): AnalyticsPayload["costTimeline"] {
  const byMonth = new Map<string, { previsto: number; realizado: number }>();
  for (const e of expenses) {
    const ref = e.dueDate ?? e.createdAt;
    const key = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
    const m = byMonth.get(key) ?? { previsto: 0, realizado: 0 };
    m.previsto += e.amount;
    m.realizado += e.paid;
    byMonth.set(key, m);
  }
  let accPrevisto = 0;
  let accRealizado = 0;
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, m]) => {
      accPrevisto += m.previsto;
      accRealizado += m.realizado;
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
      });
      return {
        mes: label.replace(".", ""),
        previsto: toReais(accPrevisto),
        realizado: toReais(accRealizado),
      };
    });
}

/** Categorias de despesa como "fornecedores": lançamentos e não quitados. */
function buildVendors(expenses: ExpenseRow[]): AnalyticsPayload["vendors"] {
  const byCategory = new Map<string, { contratos: number; pendencias: number }>();
  for (const e of expenses) {
    const v = byCategory.get(e.category) ?? { contratos: 0, pendencias: 0 };
    v.contratos += 1;
    if (e.paid < e.amount) v.pendencias += 1;
    byCategory.set(e.category, v);
  }
  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fornecedor, v]) => ({ fornecedor, ...v }));
}
