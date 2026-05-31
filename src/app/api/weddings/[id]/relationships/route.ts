import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { RelationshipCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const rels = await prisma.guestRelationship.findMany({
      where: { weddingId: id },
      include: { guest: true, related: true },
    });
    return Response.json(rels);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const data = RelationshipCreateSchema.parse(await req.json());

    const both = await prisma.guest.findMany({
      where: { id: { in: [data.guestId, data.relatedId] }, weddingId: id },
      select: { id: true },
    });
    if (both.length !== 2) throw new AuthError(400, "Invalid guests");

    const [a, b] = [data.guestId, data.relatedId].sort();
    const created = await prisma.guestRelationship.create({
      data: { type: data.type, guestId: a!, relatedId: b!, weddingId: id },
    });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
