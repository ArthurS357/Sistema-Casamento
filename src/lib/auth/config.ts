import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { ensurePersonalWorkspace } from "@/lib/workspace";
import { authLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const credSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(200),
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
      },
      async authorize(raw, req) {
        // Rate limit por IP antes de tocar no banco: contém brute-force.
        const ip = getClientIp(req as Request);
        const { success } = await checkRateLimit(authLimiter, `login:${ip}`);
        if (!success) return null;
        const parsed = credSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;
        const ok = await verifyPassword(user.password, password);
        if (!ok) return null;
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
