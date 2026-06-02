import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { ensurePersonalWorkspace } from "@/lib/workspace";
import { authLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { evaluateSoftDelete } from "@/lib/auth/soft-delete";
import { email } from "@/lib/validation/schemas";
import { z } from "zod";

const credSchema = z.object({
  email,
  password: z.string().min(8).max(200),
  totpCode: z.string().length(6).optional(),
});

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        totpCode: { label: "Código 2FA", type: "text" },
      },
      async authorize(raw, req) {
        // Rate limit por IP antes de tocar no banco: contém brute-force.
        const ip = getClientIp(req as Request);
        const { success } = await checkRateLimit(authLimiter, `login:${ip}`);
        if (!success) return null;
        const parsed = credSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, totpCode } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;
        // Bloqueio administrativo: nega autenticação antes de validar a senha.
        if (user.isBlocked) return null;
        const ok = await verifyPassword(user.password, password);
        if (!ok) return null;

        // Soft Delete — lazy evaluation
        const deleteResult = await evaluateSoftDelete(user.id, user.deleteRequestedAt);
        if (deleteResult === "expired") return null;

        // 2FA — exige código TOTP se habilitado
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!totpCode) return null;
          // Dynamic import para evitar peso no bundle edge
          const { verifySync } = await import("otplib");
          const valid = verifySync({ token: totpCode, secret: user.twoFactorSecret });
          if (!valid) return null;
        }

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) await ensurePersonalWorkspace(user.id, user.name);
    },
  },
  callbacks: {
    // Trava de bloqueio também no fluxo OAuth (Google): usuário bloqueado
    // não autentica por nenhum provedor. Soft delete também avaliado aqui.
    async signIn({ user }) {
      if (!user?.email) return true;
      const found = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, isBlocked: true, deleteRequestedAt: true },
      });
      if (!found) return true;
      if (found.isBlocked) return false;
      // Soft delete para OAuth
      if (found.deleteRequestedAt) {
        const result = await evaluateSoftDelete(found.id, found.deleteRequestedAt);
        if (result === "expired") return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
