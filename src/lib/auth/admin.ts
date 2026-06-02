import { prisma } from "@/lib/db";
import { requireUserId, AuthError } from "@/lib/auth/guards";

/**
 * Guard do Backoffice: exige systemRole === "admin".
 * Decisão de segurança crítica → consulta o banco, nunca confia só no JWT.
 * Retorna o id do admin autenticado (útil para auditoria do ator).
 */
export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true },
  });
  if (user?.systemRole !== "admin") {
    throw new AuthError(403, "Acesso restrito ao administrador do sistema.");
  }
  return userId;
}
