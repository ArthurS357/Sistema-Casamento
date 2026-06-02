import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { TaskUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string; taskId: string }> };

/** Garante que a tarefa existe E pertence à wedding acessada (anti-IDOR). */
async function assertTaskInWedding(taskId: string, weddingId: string): Promise<void> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, weddingId },
    select: { id: true },
  });
  if (!task) throw new AuthError(404, "Task not found");
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id, taskId } = await params;
    await requireWeddingAccess(id);
    await assertTaskInWedding(taskId, id);
    const data = TaskUpdateSchema.parse(await req.json());
    const updated = await prisma.task.update({ where: { id: taskId }, data });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, taskId } = await params;
    await requireWeddingAccess(id);
    await assertTaskInWedding(taskId, id);
    await prisma.task.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
