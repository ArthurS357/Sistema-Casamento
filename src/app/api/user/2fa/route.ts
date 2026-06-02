import { prisma } from "@/lib/db";
import { requireUserId, errorResponse, AuthError } from "@/lib/auth/guards";
import { generateSecret, generateURI, verifySync } from "otplib";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6),
  secret: z.string().min(16),
});

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

/** DELETE /api/user/2fa — desativa 2FA */
export async function DELETE() {
  try {
    const userId = await requireUserId();

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    return Response.json({ enabled: false });
  } catch (e) {
    return errorResponse(e);
  }
}
