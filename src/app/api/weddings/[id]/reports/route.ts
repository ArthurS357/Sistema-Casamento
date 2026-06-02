import { prisma } from "@/lib/db";
import { requireWeddingAccess, enforceUserRateLimit, errorResponse } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireWeddingAccess(id);
    // Agregação de relatório é pesada: cota por plano por usuário.
    const limited = await enforceUserRateLimit(userId, "reports");
    if (limited) return limited;

    const [wedding, expenses, guests] = await Promise.all([
      prisma.wedding.findUnique({ where: { id }, select: { budgetTotal: true, title: true, date: true } }),
      prisma.expense.findMany({ where: { weddingId: id } }),
      prisma.guest.findMany({ where: { weddingId: id } }),
    ]);
    if (!wedding) return Response.json({ error: "NotFound" }, { status: 404 });

    const byCategory: Record<string, { amount: number; paid: number }> = {};
    let totalAmount = 0;
    let totalPaid = 0;
    for (const e of expenses) {
      const k = e.category;
      byCategory[k] ??= { amount: 0, paid: 0 };
      byCategory[k].amount += e.amount;
      byCategory[k].paid += e.paid;
      totalAmount += e.amount;
      totalPaid += e.paid;
    }

    const rsvp = guests.reduce<Record<string, number>>((acc, g) => {
      acc[g.rsvpStatus] = (acc[g.rsvpStatus] ?? 0) + 1;
      return acc;
    }, {});

    const now = Date.now();
    const upcoming = expenses
      .filter((e) => e.dueDate && e.dueDate.getTime() >= now && e.paid < e.amount)
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 10);

    return Response.json({
      wedding,
      finance: {
        budgetTotal: wedding.budgetTotal,
        totalAmount,
        totalPaid,
        remaining: wedding.budgetTotal - totalPaid,
        byCategory,
        upcoming,
      },
      guests: {
        total: guests.length,
        rsvp,
        list: guests,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
