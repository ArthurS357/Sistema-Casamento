import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, AuthError } from "@/lib/auth/guards";
import { generateSecret, generateURI, verifySync } from "otplib";
import { z } from "zod";
import { authLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/auth/password";

const verifySchema = z.object({
  code: z.string().length(6),
  secret: z.string().min(16),
});

const disableSchema = z.union([
  z.object({ totpCode: z.string().length(6) }),
  z.object({ password: z.string().min(1) }),
]);

/** POST /api/user/2fa — gera secret TOTP e retorna URI para o Authenticator */
export async function POST() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (user.twoFactorEnabled) {
      throw new AuthError(400, "2FA já está ativo.");
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: "Atelier",
      label: user.email,
      secret,
      algorithm: "sha1",
      digits: 6,
      period: 30,
    });

    return Response.json({ secret, otpauthUrl });
  } catch (e) {
    return errorResponse(e);
  }
}

/** PUT /api/user/2fa — ativa 2FA verificando código TOTP */
export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { code, secret } = verifySchema.parse(body);

    const valid = verifySync({ token: code, secret });
    if (!valid) throw new AuthError(400, "Código inválido. Tente novamente.");

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });

    return Response.json({ enabled: true });
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE /api/user/2fa — desativa 2FA (requer código TOTP ou senha) */
export async function DELETE(req: Request) {
  try {
    const limited = await enforceRateLimit(req, authLimiter, "2fa-disable");
    if (limited) return limited;

    const userId = await requireUserId();
    const body = await req.json();
    const credential = disableSchema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorSecret: true, password: true },
    });

    if ("totpCode" in credential) {
      if (!user.twoFactorSecret) throw new AuthError(400, "2FA não está ativo.");
      const valid = verifySync({ token: credential.totpCode, secret: user.twoFactorSecret });
      if (!valid) throw new AuthError(400, "Código inválido. Tente novamente.");
    } else {
      if (!user.password) throw new AuthError(400, "Conta sem senha definida. Use o código TOTP.");
      const valid = await verifyPassword(user.password, credential.password);
      if (!valid) throw new AuthError(400, "Senha incorreta.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    return Response.json({ enabled: false });
  } catch (e) {
    return errorResponse(e);
  }
}
