import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
  AuthError,
} from "@/lib/auth/guards";
import { WeddingCreateSchema } from "@/lib/validation/schemas";
import { canCreateWedding } from "@/lib/permissions";
import { logSystemEvent } from "@/lib/system-log";

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

    // Paywall por plano: Free=1, Pro=2, Gestor=5 (ver PLAN_LIMITS).
    const ws = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { plan: true, _count: { select: { weddings: true } } },
    });
    if (!canCreateWedding(ws.plan, ws._count.weddings)) {
      throw new AuthError(
        403,
        "Você atingiu o limite de casamentos do seu plano. Faça upgrade para criar mais.",
      );
    }

    const created = await prisma.wedding.create({
      data: { ...data, workspaceId },
    });
    await logSystemEvent(
      "wedding.create",
      `Casamento "${created.title}" criado`,
      userId,
    );
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
