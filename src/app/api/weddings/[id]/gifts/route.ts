import { prisma } from "@/lib/db";
import { requireWeddingAccess, requirePremiumWeddingFeature, errorResponse } from "@/lib/auth/guards";
import { GiftCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

// Lista privada (painel dos noivos): exige acesso ao workspace da wedding.
// Feature premium: bloqueada no plano Free.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await requirePremiumWeddingFeature(id);
    const list = await prisma.gift.findMany({
      where: { weddingId: id },
      orderBy: [{ isPurchased: "asc" }, { createdAt: "desc" }],
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
    await requirePremiumWeddingFeature(id);
    const data = GiftCreateSchema.parse(await req.json());
    const created = await prisma.gift.create({ data: { ...data, weddingId: id } });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
