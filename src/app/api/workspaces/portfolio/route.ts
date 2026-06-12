import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  enforceUserRateLimit,
  errorResponse,
  AuthError,
} from "@/lib/auth/guards";
import { canManageMultipleWeddings } from "@/lib/permissions";
import type { PortfolioPayload } from "@/types/api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);

    // Paywall server-side: visão de carteira é exclusiva do plano Gestor.
    const ws = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { plan: true },
    });
    if (!canManageMultipleWeddings(ws.plan)) {
      throw new AuthError(403, "Recurso disponível apenas no plano Gestor.");
    }

    // Agregação de carteira é pesada: cota por plano por usuário.
    const limited = await enforceUserRateLimit(userId, "portfolio");
    if (limited) return limited;

    const now = new Date();
    const weekAhead = new Date(now.getTime() + WEEK_MS);

    const [weddings, pendingByWedding, dueSoonExpenses] = await Promise.all([
      // Próximos eventos do workspace, ordenados pela data.
      prisma.wedding.findMany({
        where: { workspaceId, date: { gte: now } },
        orderBy: { date: "asc" },
        select: { id: true, title: true, date: true, partner1Name: true, partner2Name: true },
      }),
      // RSVPs pendentes do workspace inteiro, quebrados por casamento.
      prisma.guest.groupBy({
        by: ["weddingId"],
        where: { wedding: { workspaceId }, rsvpStatus: "pending" },
        _count: { _all: true },
      }),
      // Vencimentos da próxima semana. `paid < amount` não entra no where
      // (Prisma não compara colunas entre si): saldo devedor reduzido aqui.
      prisma.expense.findMany({
        where: { wedding: { workspaceId }, dueDate: { gte: now, lt: weekAhead } },
        select: { weddingId: true, amount: true, paid: true },
      }),
    ]);

    const pendingMap = new Map(
      pendingByWedding.map((g) => [g.weddingId, g._count._all]),
    );

    const dueSoonMap = new Map<string, number>();
    let dueSoonCents = 0;
    let dueSoonCount = 0;
    for (const e of dueSoonExpenses) {
      const owed = e.amount - e.paid;
      if (owed <= 0) continue;
      dueSoonMap.set(e.weddingId, (dueSoonMap.get(e.weddingId) ?? 0) + owed);
      dueSoonCents += owed;
      dueSoonCount += 1;
    }

    const payload: PortfolioPayload = {
      weddings: weddings.map((w) => ({
        id: w.id,
        title: w.title,
        date: w.date.toISOString(),
        partner1Name: w.partner1Name,
        partner2Name: w.partner2Name,
        pendingRsvps: pendingMap.get(w.id) ?? 0,
        dueSoonCents: dueSoonMap.get(w.id) ?? 0,
      })),
      totals: {
        activeWeddings: weddings.length,
        dueSoonCents,
        dueSoonCount,
        // Global: soma todos os casamentos do workspace, inclusive já realizados.
        pendingRsvps: pendingByWedding.reduce((sum, g) => sum + g._count._all, 0),
      },
    };

    return Response.json(payload);
  } catch (e) {
    return errorResponse(e);
  }
}
