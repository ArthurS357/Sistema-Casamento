import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse } from "@/lib/auth/guards";

const LIST_LIMIT = 100;

// GET /api/admin/logs → trilha de auditoria recente (SystemLog)
export async function GET() {
  try {
    await requireAdmin();
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    });
    return Response.json({ logs });
  } catch (e) {
    return errorResponse(e);
  }
}
