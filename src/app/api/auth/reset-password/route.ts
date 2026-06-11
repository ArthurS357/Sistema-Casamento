import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { errorResponse, AuthError } from "@/lib/auth/guards";
import { authLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(200),
});

/** POST /api/auth/reset-password — valida token e altera senha */
export async function POST(req: Request) {
  try {
    // Auditoria S3: contém brute-force de tokens (5 tentativas/60s por IP),
    // mesmo padrão das rotas vizinhas (forgot-password/register).
    const limited = await enforceRateLimit(req, authLimiter, "reset-password");
    if (limited) return limited;

    const body = await req.json();
    const { token, password } = schema.parse(body);

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, isBlocked: true } } },
    });

    if (!record) throw new AuthError(400, "Token inválido ou expirado.");
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      throw new AuthError(400, "Token expirado. Solicite um novo link.");
    }
    if (record.user.isBlocked) throw new AuthError(403, "Conta bloqueada.");

    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
