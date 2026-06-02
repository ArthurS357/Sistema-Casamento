import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { errorResponse } from "@/lib/auth/guards";
import { authLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

/** POST /api/auth/forgot-password — gera token de 1h e envia e-mail */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, authLimiter, "forgot-password");
    if (limited) return limited;

    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, isBlocked: true },
    });

    // Sempre retorna 200 para evitar enumeração de e-mails
    if (!user || user.isBlocked) {
      return Response.json({ ok: true });
    }

    // Invalida tokens anteriores
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? "",
      token,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
