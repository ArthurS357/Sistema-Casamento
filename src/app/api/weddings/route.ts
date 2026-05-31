import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
} from "@/lib/auth/guards";
import { WeddingCreateSchema } from "@/lib/validation/schemas";

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
    const created = await prisma.wedding.create({
      data: { ...data, workspaceId },
    });
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
