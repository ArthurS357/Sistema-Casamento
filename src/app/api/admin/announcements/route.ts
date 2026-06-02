import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse, AuthError } from "@/lib/auth/guards";
import {
  AnnouncementCreateSchema,
  AnnouncementUpdateSchema,
} from "@/lib/validation/schemas";
import { logSystemEvent } from "@/lib/system-log";

// GET /api/admin/announcements → lista todos (ativos e inativos)
export async function GET() {
  try {
    await requireAdmin();
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ announcements });
  } catch (e) {
    return errorResponse(e);
  }
}

// POST /api/admin/announcements → cria anúncio
export async function POST(req: Request) {
  try {
    const adminId = await requireAdmin();
    const data = AnnouncementCreateSchema.parse(await req.json());
    const created = await prisma.announcement.create({ data });
    await logSystemEvent(
      "announcement.create",
      `Anúncio "${created.title}" criado`,
      adminId,
    );
    return Response.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

// PATCH /api/admin/announcements?id=<id> → liga/desliga (isActive)
export async function PATCH(req: Request) {
  try {
    const adminId = await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new AuthError(400, "id obrigatório");

    const { isActive } = AnnouncementUpdateSchema.parse(await req.json());
    const updated = await prisma.announcement.update({
      where: { id },
      data: { isActive },
    });
    await logSystemEvent(
      "announcement.toggle",
      `Anúncio "${updated.title}" ${isActive ? "ativado" : "desativado"}`,
      adminId,
    );
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
