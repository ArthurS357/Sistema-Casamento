import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse } from "@/lib/auth/guards";
import { TaskCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

// Checklist privado (painel dos noivos): exige acesso ao workspace da wedding.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const list = await prisma.task.findMany({
      where: { weddingId: id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
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
    const data = TaskCreateSchema.parse(await req.json());
    const created = await prisma.task.create({ data: { ...data, weddingId: id } });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
