import { prisma } from "@/lib/db";
import { requireUserId, errorResponse } from "@/lib/auth/guards";

// GET /api/announcements/active → anúncios ativos para exibir na app.
// Protegido: apenas usuários autenticados (banner mora na área logada).
export async function GET() {
  try {
    await requireUserId();
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, message: true, type: true },
    });
    return Response.json({ announcements });
  } catch (e) {
    return errorResponse(e);
  }
}
