import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { GuestUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string; guestId: string }> };

async function ensureGuest(weddingId: string, guestId: string) {
  const g = await prisma.guest.findUnique({ where: { id: guestId }, select: { weddingId: true } });
  if (!g || g.weddingId !== weddingId) throw new AuthError(404, "Guest not found");
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id, guestId } = await params;
    await requireWeddingAccess(id);
    await ensureGuest(id, guestId);
    const g = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        seat: { include: { table: true } },
        relationshipsFrom: { include: { related: true } },
        relationshipsTo: { include: { guest: true } },
      },
    });
    return Response.json(g);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, guestId } = await params;
    await requireWeddingAccess(id);
    await ensureGuest(id, guestId);
    const data = GuestUpdateSchema.parse(await req.json());

    if (data.seatId !== undefined) {
      const result = await prisma.$transaction(async (tx) => {
        if (data.seatId) {
          const seat = await tx.seat.findUnique({
            where: { id: data.seatId },
            include: { table: true, guest: true },
          });
          if (!seat || seat.table.weddingId !== id) throw new AuthError(400, "Invalid seat");
          if (seat.guest && seat.guest.id !== guestId) {
            await tx.guest.update({ where: { id: seat.guest.id }, data: { seatId: null } });
          }
        }
        return tx.guest.update({ where: { id: guestId }, data });
      });
      return Response.json(result);
    }

    const updated = await prisma.guest.update({ where: { id: guestId }, data });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, guestId } = await params;
    await requireWeddingAccess(id);
    await ensureGuest(id, guestId);
    await prisma.guest.delete({ where: { id: guestId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
