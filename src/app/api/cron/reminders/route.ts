import { prisma } from "@/lib/db";
import { PAID_PLANS } from "@/lib/plans";
import { sendRsvpReminderEmail, sendExpenseReminderEmail } from "@/lib/mail";

// Motor de lembretes automáticos (Vercel Cron, diário às 12:00 UTC).
// Feature Pro/Gestor: cobre RSVP pendente (D-30 e D-14 do casamento) e
// despesas não quitadas vencendo hoje ou em 7 dias.
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const DAY_MS = 86_400_000;

/**
 * Janela [00:00 UTC do dia alvo, 00:00 UTC do dia seguinte). Datas de
 * casamento/vencimento são salvas como DateTime; truncar por dia evita
 * perder registros por causa do componente de hora.
 */
function utcDayWindow(daysFromNow: number): { gte: Date; lt: Date } {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromNow);
  return { gte: new Date(start), lt: new Date(start + DAY_MS) };
}

async function sweepPendingRsvps(): Promise<{ weddings: number; sent: number; skipped: number }> {
  const pendingGuests = { rsvpStatus: "pending", email: { not: null } } as const;
  const weddings = await prisma.wedding.findMany({
    where: {
      workspace: { plan: { in: [...PAID_PLANS] } },
      OR: [{ date: utcDayWindow(30) }, { date: utcDayWindow(14) }],
      guests: { some: pendingGuests },
    },
    select: {
      title: true,
      date: true,
      guests: {
        where: pendingGuests,
        select: { name: true, email: true, rsvpToken: true },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  for (const wedding of weddings) {
    for (const guest of wedding.guests) {
      if (!guest.email) continue; // narrowing: where já garante, tipo não
      // Sequencial de propósito: Resend limita ~2 req/s; paralelizar estoura cota.
      const result = await sendRsvpReminderEmail({
        to: guest.email,
        guestName: guest.name,
        weddingTitle: wedding.title,
        weddingDate: wedding.date,
        rsvpUrl: `${APP_URL}/rsvp/${guest.rsvpToken}`,
      });
      if (result.sent) sent++;
      else skipped++;
    }
  }
  return { weddings: weddings.length, sent, skipped };
}

async function sweepDueExpenses(): Promise<{ expenses: number; sent: number; skipped: number }> {
  const tomorrow = utcDayWindow(0).lt;
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [{ dueDate: utcDayWindow(0) }, { dueDate: utcDayWindow(7) }],
      paid: { lt: prisma.expense.fields.amount }, // não quitada (comparação coluna a coluna)
      wedding: { workspace: { plan: { in: [...PAID_PLANS] } } },
    },
    select: {
      category: true,
      description: true,
      amount: true,
      paid: true,
      dueDate: true,
      wedding: {
        select: {
          id: true,
          title: true,
          workspace: {
            select: {
              memberships: { select: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      },
    },
  });

  // Agrupa por casamento: 1 e-mail por membro listando todas as contas,
  // em vez de 1 e-mail por despesa.
  const byWedding = new Map<string, typeof expenses>();
  for (const expense of expenses) {
    const group = byWedding.get(expense.wedding.id) ?? [];
    group.push(expense);
    byWedding.set(expense.wedding.id, group);
  }

  let sent = 0;
  let skipped = 0;
  for (const group of byWedding.values()) {
    const wedding = group[0]!.wedding;
    const items = group.map((e) => ({
      label: e.description ? `${e.category} — ${e.description}` : e.category,
      amountDueCents: e.amount - e.paid,
      dueLabel: e.dueDate && e.dueDate < tomorrow ? "vence hoje" : "vence em 7 dias",
    }));
    for (const { user } of wedding.workspace.memberships) {
      const result = await sendExpenseReminderEmail({
        to: user.email,
        recipientName: user.name,
        weddingTitle: wedding.title,
        items,
      });
      if (result.sent) sent++;
      else skipped++;
    }
  }
  return { expenses: expenses.length, sent, skipped };
}

export async function GET(req: Request) {
  // Fail-closed: sem CRON_SECRET configurado, rota não roda.
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CronNotConfigured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rsvp = await sweepPendingRsvps();
  const finance = await sweepDueExpenses();
  console.log("[cron/reminders]", JSON.stringify({ rsvp, finance }));
  return Response.json({ ok: true, rsvp, finance });
}
