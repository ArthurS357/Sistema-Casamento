import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { RegisterSchema } from "@/lib/validation/schemas";
import { errorResponse } from "@/lib/auth/guards";
import { ensurePersonalWorkspace } from "@/lib/workspace";
import { authLimiter, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, authLimiter, "register");
    if (limited) return limited;
    const body = await req.json();
    const data = RegisterSchema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return Response.json({ error: "EmailTaken" }, { status: 409 });
    const password = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password },
      select: { id: true, email: true, name: true },
    });
    await ensurePersonalWorkspace(user.id, data.name);
    return Response.json(user, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
