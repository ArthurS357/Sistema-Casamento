import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { GiftUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string; giftId: string }> };

/** Garante que o presente existe E pertence à wedding acessada (anti-IDOR). */
async function assertGiftInWedding(giftId: string, weddingId: string): Promise<void> {
  const gift = await prisma.gift.findFirst({
    where: { id: giftId, weddingId },
    select: { id: true },
  });
  if (!gift) throw new AuthError(404, "Gift not found");
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, giftId } = await params;
    await requireWeddingAccess(id);
    await assertGiftInWedding(giftId, id);
    const data = GiftUpdateSchema.parse(await req.json());
    const updated = await prisma.gift.update({ where: { id: giftId }, data });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, giftId } = await params;
    await requireWeddingAccess(id);
    await assertGiftInWedding(giftId, id);
    await prisma.gift.delete({ where: { id: giftId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
