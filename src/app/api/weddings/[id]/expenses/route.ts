import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse } from "@/lib/auth/guards";
import { ExpenseCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const list = await prisma.expense.findMany({
      where: { weddingId: id },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    });
    return Response.json(list);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const data = ExpenseCreateSchema.parse(await req.json());
    const created = await prisma.expense.create({ data: { ...data, weddingId: id } });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
