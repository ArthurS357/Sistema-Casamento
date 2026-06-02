import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, AuthError } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logSystemEvent } from "@/lib/system-log";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8).max(200).optional(),
}).refine(
  (d) => !(d.newPassword && !d.currentPassword),
  { message: "Senha atual obrigatória para alterar senha", path: ["currentPassword"] },
);

/** GET /api/user/profile — dados do perfil */
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        twoFactorEnabled: true,
        deleteRequestedAt: true,
        createdAt: true,
      },
    });
    return Response.json(user);
  } catch (e) {
    return errorResponse(e);
  }
}

/** PATCH /api/user/profile — atualiza nome e/ou senha */
export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.name = data.name;

    if (data.newPassword && data.currentPassword) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { password: true },
      });
      if (!user.password) throw new AuthError(400, "Conta sem senha (OAuth). Defina uma senha primeiro.");
      const ok = await verifyPassword(user.password, data.currentPassword);
      if (!ok) throw new AuthError(400, "Senha atual incorreta.");
      updateData.password = await hashPassword(data.newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AuthError(400, "Nenhum campo para atualizar.");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, image: true },
    });

    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE /api/user/profile — solicita exclusão (soft delete, 30 dias de carência) */
export async function DELETE() {
  try {
    const userId = await requireUserId();

    await prisma.user.update({
      where: { id: userId },
      data: { deleteRequestedAt: new Date() },
    });

    await logSystemEvent("user.delete-request", `Usuário solicitou exclusão de conta`, userId);

    return Response.json({ ok: true, message: "Conta marcada para exclusão. Faça login nos próximos 30 dias para cancelar." });
  } catch (e) {
    return errorResponse(e);
  }
}
