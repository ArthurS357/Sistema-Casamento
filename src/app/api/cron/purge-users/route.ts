import { prisma } from "@/lib/db";

// Expurgo de soft delete (Vercel Cron, diário às 03:00 UTC).
// LGPD: efetiva a exclusão de Users cujo deleteRequestedAt passou da
// janela de carência de 30 dias. Sessions, accounts (OAuth), tokens de
// reset e memberships caem por onDelete: Cascade no schema.
//
// onDelete: Cascade apaga a Membership do User, mas NÃO o Workspace.
// Workspaces onde o expurgado era único membro ficariam órfãos com seus
// Weddings/Guests (dados pessoais de terceiros) — violação de LGPD. Por
// isso, antes de deletar o User, removemos os Workspaces que ficariam sem
// membros (delete cascateia Weddings → Guests).
export const dynamic = "force-dynamic";

const GRACE_PERIOD_DAYS = 30;
const DAY_MS = 86_400_000;

export async function GET(req: Request) {
  // Fail-closed: sem CRON_SECRET configurado, rota não roda.
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CronNotConfigured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Limite: solicitações feitas há mais de 30 dias.
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * DAY_MS);
  const expired = await prisma.user.findMany({
    where: { deleteRequestedAt: { lte: cutoff } },
    select: {
      id: true,
      memberships: {
        select: { workspaceId: true, workspace: { select: { _count: { select: { memberships: true } } } } },
      },
    },
  });

  let purgedUsers = 0;
  let purgedWorkspaces = 0;

  for (const user of expired) {
    // Workspaces onde este User é o único membro → órfãos após o expurgo.
    const orphanWorkspaceIds = user.memberships
      .filter((m) => m.workspace._count.memberships === 1)
      .map((m) => m.workspaceId);

    // Transação por User: workspaces órfãos + o próprio User caem juntos,
    // evitando estado inconsistente se o cron sofrer timeout no meio.
    await prisma.$transaction([
      prisma.workspace.deleteMany({ where: { id: { in: orphanWorkspaceIds } } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    purgedUsers++;
    purgedWorkspaces += orphanWorkspaceIds.length;
  }

  console.log("[cron/purge-users]", JSON.stringify({ purgedUsers, purgedWorkspaces, cutoff }));
  return Response.json({ ok: true, purgedUsers, purgedWorkspaces });
}
