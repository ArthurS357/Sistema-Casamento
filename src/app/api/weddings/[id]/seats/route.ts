import { prisma } from "@/lib/db";
import { requireWeddingAccess, requirePremiumWeddingFeature, errorResponse, AuthError } from "@/lib/auth/guards";
import { SeatCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

// Seating faz parte da feature premium de Mesas: bloqueada no Free.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await requirePremiumWeddingFeature(id);
    const seats = await prisma.seat.findMany({
      where: { table: { weddingId: id } },
      include: { guest: true, table: true },
      orderBy: [{ tableId: "asc" }, { number: "asc" }],
    });
    return Response.json(seats);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await requirePremiumWeddingFeature(id);
    const data = SeatCreateSchema.parse(await req.json());
    const t = await prisma.table.findUnique({ where: { id: data.tableId }, select: { weddingId: true } });
    if (!t || t.weddingId !== id) throw new AuthError(400, "Invalid table");
    const seat = await prisma.seat.create({ data });
    return Response.json(seat, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
