import { prisma } from "@/lib/db";

/**
 * Registra um evento na trilha de auditoria (SystemLog).
 * Disparo gracioso: falha de log nunca derruba a operação de negócio.
 *
 * @param action  chave estável da ação (ex: "wedding.create", "user.block")
 * @param details texto legível (ex: "Usuário X criou Casamento Y")
 * @param userId  ator/sujeito do evento (opcional)
 */
export async function logSystemEvent(
  action: string,
  details?: string,
  userId?: string | null,
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: { action, details: details ?? null, userId: userId ?? null },
    });
  } catch (e) {
    console.error("systemLog falhou:", e);
  }
}
