import { prisma } from "@/lib/db";
import { requireUserId, getActiveWorkspaceId, errorResponse } from "@/lib/auth/guards";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { id: true, name: true, plan: true }
    });
    return Response.json(workspace);
  } catch (e) {
    return errorResponse(e);
  }
}
