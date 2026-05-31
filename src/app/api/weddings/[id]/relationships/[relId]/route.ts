import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string; relId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, relId } = await params;
    await requireWeddingAccess(id);
    const r = await prisma.guestRelationship.findUnique({
      where: { id: relId },
      select: { weddingId: true },
    });
    if (!r || r.weddingId !== id) throw new AuthError(404, "Not found");
    await prisma.guestRelationship.delete({ where: { id: relId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
