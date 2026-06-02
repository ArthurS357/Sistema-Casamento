import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
  AuthError,
} from "@/lib/auth/guards";
import { WorkspaceMemberInviteSchema } from "@/lib/validation/schemas";
import { canAddWorkspaceMember, maxWorkspaceMembers } from "@/lib/permissions";

/** Garante que o usuário é owner/admin do workspace (pode gerir membros). */
async function requireManager(userId: string, workspaceId: string): Promise<void> {
  const me = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (!me) throw new AuthError(403, "Forbidden");
  if (me.role !== "owner" && me.role !== "admin") {
    throw new AuthError(403, "Apenas o dono do workspace pode gerenciar membros.");
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    await requireManager(userId, workspaceId);

    const ws = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: {
        plan: true,
        memberships: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return Response.json({
      members: ws.memberships,
      plan: ws.plan,
      limit: maxWorkspaceMembers(ws.plan),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    await requireManager(userId, workspaceId);

    const { email } = WorkspaceMemberInviteSchema.parse(await req.json());

    const ws = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { plan: true, _count: { select: { memberships: true } } },
    });

    // Paywall: Free só permite o dono; Pro libera 1 membro extra (2 no total).
    if (!canAddWorkspaceMember(ws.plan, ws._count.memberships)) {
      throw new AuthError(
        403,
        "Seu plano não permite adicionar mais membros. Faça upgrade para o Pro para convidar seu parceiro(a).",
      );
    }

    const invitee = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!invitee) {
      throw new AuthError(404, "Nenhuma conta encontrada com esse e-mail. Peça para a pessoa se cadastrar primeiro.");
    }

    const existing = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: invitee.id, workspaceId } },
      select: { id: true },
    });
    if (existing) {
      throw new AuthError(409, "Essa pessoa já faz parte do workspace.");
    }

    const member = await prisma.membership.create({
      data: { userId: invitee.id, workspaceId, role: "member" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return Response.json(member, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    await requireManager(userId, workspaceId);

    const membershipId = new URL(req.url).searchParams.get("id");
    if (!membershipId) throw new AuthError(400, "membershipId obrigatório");

    const target = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { id: true, role: true, workspaceId: true },
    });
    if (!target || target.workspaceId !== workspaceId) {
      throw new AuthError(404, "Membro não encontrado");
    }
    if (target.role === "owner") {
      throw new AuthError(403, "Não é possível remover o dono do workspace.");
    }

    await prisma.membership.delete({ where: { id: membershipId } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
