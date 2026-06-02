import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
  AuthError,
} from "@/lib/auth/guards";
import { WeddingCreateSchema } from "@/lib/validation/schemas";
import { canCreateWedding } from "@/lib/permissions";

export async function GET() {
  try {
    const userId = await requireUserId();
    const list = await prisma.wedding.findMany({
      where: { workspace: { memberships: { some: { userId } } } },
      orderBy: { date: "asc" },
    });
    return Response.json(list);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const data = WeddingCreateSchema.parse(await req.json());
    const workspaceId = await getActiveWorkspaceId(userId);

    // Paywall: plano Free limitado a 1 casamento (gestor é ilimitado).
    const ws = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { plan: true, _count: { select: { weddings: true } } },
    });
    if (!canCreateWedding(ws.plan, ws._count.weddings)) {
      throw new AuthError(
        403,
        "Seu plano permite apenas 1 casamento. Faça upgrade para o Pro ou Gestor para criar mais.",
      );
    }

    const created = await prisma.wedding.create({
      data: { ...data, workspaceId },
    });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
