import { prisma } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-log";

const GRACE_PERIOD_DAYS = 30;

/**
 * Anonimiza o usuário: nome neutro, e-mail UUID, senha null, bloqueado.
 * Reutiliza mesma lógica do Admin (api/admin/users DELETE).
 */
export async function anonymizeUser(userId: string): Promise<void> {
  const anonEmail = `deleted+${crypto.randomUUID()}@anon.local`;
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: "Usuário Deletado",
      email: anonEmail,
      password: null,
      image: null,
      isBlocked: true,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      deleteRequestedAt: null,
    },
  });
  await logSystemEvent("user.self-anonymize", `Usuário ${userId} auto-anonimizado após carência`, userId);
}

/**
 * Avalia soft delete no login (lazy evaluation).
 * Retorna:
 *  - "ok" → conta ativa ou restaurada (pode logar)
 *  - "expired" → carência expirou, anonimizado (não pode logar)
 *  - null → sem solicitação de exclusão pendente
 */
export async function evaluateSoftDelete(
  userId: string,
  deleteRequestedAt: Date | null,
): Promise<"ok" | "expired" | null> {
  if (!deleteRequestedAt) return null;

  const now = new Date();
  const elapsed = now.getTime() - deleteRequestedAt.getTime();
  const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  if (elapsed < graceMs) {
    // Dentro da carência → restaura conta
    await prisma.user.update({
      where: { id: userId },
      data: { deleteRequestedAt: null },
    });
    await logSystemEvent("user.restore", `Conta restaurada via login dentro da carência`, userId);
    return "ok";
  } else {
    // Carência expirada → anonimiza
    await anonymizeUser(userId);
    return "expired";
  }
}
