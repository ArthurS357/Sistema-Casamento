import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse, AuthError } from "@/lib/auth/guards";
import { TableUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string; tableId: string }> };

async function ensureTable(weddingId: string, tableId: string) {
  const t = await prisma.table.findUnique({ where: { id: tableId }, select: { weddingId: true } });
  if (!t || t.weddingId !== weddingId) throw new AuthError(404, "Table not found");
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await requireWeddingAccess(id);
    await ensureTable(id, tableId);
    return Response.json(
      await prisma.table.findUnique({
        where: { id: tableId },
        include: { seats: { include: { guest: true }, orderBy: { number: "asc" } } },
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await requireWeddingAccess(id);
    await ensureTable(id, tableId);
    const data = TableUpdateSchema.parse(await req.json());

    if (data.capacity !== undefined) {
      const updated = await prisma.$transaction(async (tx) => {
        const cur = await tx.seat.findMany({
          where: { tableId },
          orderBy: { number: "asc" },
          include: { guest: true },
        });
        const cap = data.capacity!;
        if (cap > cur.length) {
          await tx.seat.createMany({
            data: Array.from({ length: cap - cur.length }, (_, i) => ({
              tableId,
              number: cur.length + i + 1,
            })),
          });
        } else if (cap < cur.length) {
          const toRemove = cur.slice(cap);
          if (toRemove.some((s) => s.guest)) throw new AuthError(400, "Seats in use");
          await tx.seat.deleteMany({ where: { id: { in: toRemove.map((s) => s.id) } } });
        }
        return tx.table.update({ where: { id: tableId }, data });
      });
      return Response.json(updated);
    }

    return Response.json(await prisma.table.update({ where: { id: tableId }, data }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await requireWeddingAccess(id);
    await ensureTable(id, tableId);
    await prisma.table.delete({ where: { id: tableId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
