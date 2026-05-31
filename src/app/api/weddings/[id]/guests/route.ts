import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse } from "@/lib/auth/guards";
import { GuestCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const guests = await prisma.guest.findMany({
      where: { weddingId: id },
      orderBy: { createdAt: "asc" },
      include: { seat: { include: { table: true } } },
    });
    return Response.json(guests);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const data = GuestCreateSchema.parse(await req.json());
    const created = await prisma.guest.create({ data: { ...data, weddingId: id } });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
