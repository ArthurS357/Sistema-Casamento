import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { ExpenseUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string; expenseId: string }> };

async function ensureExpense(weddingId: string, expenseId: string) {
  const e = await prisma.expense.findUnique({ where: { id: expenseId }, select: { weddingId: true } });
  if (!e || e.weddingId !== weddingId) throw new AuthError(404, "Expense not found");
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id, expenseId } = await params;
    await requireWeddingAccess(id);
    await ensureExpense(id, expenseId);
    return Response.json(await prisma.expense.findUnique({ where: { id: expenseId } }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, expenseId } = await params;
    await requireWeddingAccess(id);
    await ensureExpense(id, expenseId);
    const data = ExpenseUpdateSchema.parse(await req.json());
    return Response.json(await prisma.expense.update({ where: { id: expenseId }, data }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, expenseId } = await params;
    await requireWeddingAccess(id);
    await ensureExpense(id, expenseId);
    await prisma.expense.delete({ where: { id: expenseId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
