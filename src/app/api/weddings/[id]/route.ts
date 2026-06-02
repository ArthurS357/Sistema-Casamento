import { prisma } from "@/lib/db";
import { requireWeddingAccess, errorResponse } from "@/lib/auth/guards";
import { WeddingUpdateSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const w = await prisma.wedding.findUnique({
      where: { id },
      include: {
        _count: { select: { guests: true, expenses: true, tables: true, gifts: true } },
      },
    });
    return Response.json(w);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    const data = WeddingUpdateSchema.parse(await req.json());
    const updated = await prisma.wedding.update({ where: { id }, data });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await requireWeddingAccess(id);
    await prisma.wedding.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
