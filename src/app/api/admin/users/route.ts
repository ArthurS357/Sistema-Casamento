import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse, AuthError } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { AdminUserActionSchema } from "@/lib/validation/schemas";
import { isPlan } from "@/lib/plans";
import { logSystemEvent } from "@/lib/system-log";

/** Senha padrão atribuída no reset administrativo. */
const RESET_PASSWORD = "Mudar@123";
/** Teto defensivo da listagem (painel admin, dataset pequeno). */
const LIST_LIMIT = 200;

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  systemRole: true,
  isBlocked: true,
  createdAt: true,
  // workspace pessoal (membership mais antigo) → fonte do plano exibido.
  memberships: {
    orderBy: { createdAt: "asc" },
    take: 1,
    select: { workspace: { select: { id: true, plan: true } } },
  },
} as const;

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  systemRole: string;
  isBlocked: boolean;
  createdAt: Date;
  plan: string;
  workspaceId: string | null;
};

function shape(u: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  systemRole: string;
  isBlocked: boolean;
  createdAt: Date;
  memberships: { workspace: { id: string; plan: string } }[];
}): UserRow {
  const ws = u.memberships[0]?.workspace;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    systemRole: u.systemRole,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
    plan: ws?.plan ?? "free",
    workspaceId: ws?.id ?? null,
  };
}

/** Resolve o workspace pessoal (membership mais antigo) de um usuário. */
async function personalWorkspaceId(userId: string): Promise<string> {
  const m = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (!m) throw new AuthError(404, "Usuário sem workspace.");
  return m.workspaceId;
}

// GET /api/admin/users?q=<nome>&plan=<free|pro|gestor>
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const planFilter = url.searchParams.get("plan")?.trim() ?? "";

    const users = await prisma.user.findMany({
      where: q ? { name: { contains: q } } : undefined,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: userSelect,
    });

    let rows = users.map(shape);
    // Plano vive no Workspace → filtro aplicado após o shape.
    if (planFilter && isPlan(planFilter)) {
      rows = rows.filter((r) => r.plan === planFilter);
    }

    return Response.json({ users: rows });
  } catch (e) {
    return errorResponse(e);
  }
}

// PATCH /api/admin/users?id=<userId>  body: AdminUserAction
export async function PATCH(req: Request) {
  try {
    const adminId = await requireAdmin();
    const targetId = new URL(req.url).searchParams.get("id");
    if (!targetId) throw new AuthError(400, "id obrigatório");

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, name: true, systemRole: true },
    });
    if (!target) throw new AuthError(404, "Usuário não encontrado");

    const body = AdminUserActionSchema.parse(await req.json());

    switch (body.action) {
      case "setPlan": {
        const wsId = await personalWorkspaceId(targetId);
        await prisma.workspace.update({
          where: { id: wsId },
          data: { plan: body.plan },
        });
        await logSystemEvent(
          "user.setPlan",
          `Plano de ${target.email} alterado para ${body.plan}`,
          adminId,
        );
        break;
      }
      case "setBlocked": {
        // Trava de segurança: ninguém bloqueia a si mesmo nem a outro admin.
        if (targetId === adminId)
          throw new AuthError(400, "Você não pode bloquear a si mesmo.");
        if (target.systemRole === "admin")
          throw new AuthError(403, "Não é possível bloquear outro administrador.");
        await prisma.user.update({
          where: { id: targetId },
          data: { isBlocked: body.isBlocked },
        });
        await logSystemEvent(
          body.isBlocked ? "user.block" : "user.unblock",
          `${target.email} ${body.isBlocked ? "bloqueado" : "reativado"}`,
          adminId,
        );
        break;
      }
      case "resetPassword": {
        const password = await hashPassword(RESET_PASSWORD);
        await prisma.user.update({
          where: { id: targetId },
          data: { password },
        });
        await logSystemEvent(
          "user.resetPassword",
          `Senha de ${target.email} redefinida para o padrão`,
          adminId,
        );
        break;
      }
    }

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: targetId },
      select: userSelect,
    });
    return Response.json(shape(updated));
  } catch (e) {
    return errorResponse(e);
  }
}

// DELETE /api/admin/users?id=<userId>  → anonimização (não apaga o registro)
export async function DELETE(req: Request) {
  try {
    const adminId = await requireAdmin();
    const targetId = new URL(req.url).searchParams.get("id");
    if (!targetId) throw new AuthError(400, "id obrigatório");

    if (targetId === adminId)
      throw new AuthError(400, "Você não pode anonimizar a si mesmo.");

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, systemRole: true },
    });
    if (!target) throw new AuthError(404, "Usuário não encontrado");
    if (target.systemRole === "admin")
      throw new AuthError(403, "Não é possível anonimizar outro administrador.");

    // Anonimização: preserva FKs (casamentos, memberships) intactos.
    // Nome neutro, e-mail aleatório único, senha limpa, login bloqueado.
    const anonEmail = `deleted+${crypto.randomUUID()}@anon.local`;
    await prisma.user.update({
      where: { id: targetId },
      data: {
        name: "Usuário Deletado",
        email: anonEmail,
        password: null,
        image: null,
        isBlocked: true,
      },
    });
    await logSystemEvent(
      "user.anonymize",
      `${target.email} anonimizado`,
      adminId,
    );

    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
