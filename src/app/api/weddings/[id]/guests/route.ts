import { prisma } from "@/lib/db";
import {
  requireWeddingAccess,
  getWeddingPlan,
  errorResponse,
  AuthError,
} from "@/lib/auth/guards";
import { canAddGuest, maxGuestsPerWedding } from "@/lib/permissions";
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
    // Paywall server-side: o teto de convidados (Free = 50) não confia na UI.
    const plan = await getWeddingPlan(id);
    const count = await prisma.guest.count({ where: { weddingId: id } });
    if (!canAddGuest(plan, count)) {
      throw new AuthError(
        403,
        `Limite de ${maxGuestsPerWedding(plan)} convidados do plano Free atingido. Faça upgrade para convidados ilimitados.`,
      );
    }
    const data = GuestCreateSchema.parse(await req.json());
    const created = await prisma.guest.create({ data: { ...data, weddingId: id } });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
