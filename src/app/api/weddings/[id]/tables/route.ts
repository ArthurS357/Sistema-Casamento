import { prisma } from "@/lib/db";
import { requireWeddingAccess, requirePremiumWeddingFeature, errorResponse } from "@/lib/auth/guards";
import { TableCreateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

// Mesas/Seating: feature premium, bloqueada no plano Free.
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await requirePremiumWeddingFeature(id);
    const tables = await prisma.table.findMany({
      where: { weddingId: id },
      include: { seats: { include: { guest: true }, orderBy: { number: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(tables);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await requirePremiumWeddingFeature(id);
    const data = TableCreateSchema.parse(await req.json());
    const created = await prisma.$transaction(async (tx) => {
      const t = await tx.table.create({ data: { ...data, weddingId: id } });
      await tx.seat.createMany({
        data: Array.from({ length: data.capacity }, (_, i) => ({
          tableId: t.id,
          number: i + 1,
        })),
      });
      return tx.table.findUnique({
        where: { id: t.id },
        include: { seats: { orderBy: { number: "asc" } } },
      });
    });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
