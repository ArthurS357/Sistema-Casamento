import { prisma } from "@/lib/db";

// Expurgo de soft delete (Vercel Cron, diário às 03:00 UTC).
// LGPD: efetiva a exclusão de Users cujo deleteRequestedAt passou da
// janela de carência de 30 dias. Sessions, accounts (OAuth), tokens de
// reset e memberships caem por onDelete: Cascade no schema.
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
  const { count } = await prisma.user.deleteMany({
    where: { deleteRequestedAt: { lte: cutoff } },
  });

  console.log("[cron/purge-users]", JSON.stringify({ purged: count, cutoff }));
  return Response.json({ ok: true, purged: count });
}
