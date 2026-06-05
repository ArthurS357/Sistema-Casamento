import { prisma } from "@/lib/db";
import { requireUserId, errorResponse } from "@/lib/auth/guards";
import { z } from "zod";

const PrivacySchema = z.object({
  aiConsent: z.boolean(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, aiConsent: true },
    });
    return Response.json(user);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();
    const data = PrivacySchema.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) {
      return Response.json({ error: "Usuário não encontrado. Faça login novamente." }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { aiConsent: data.aiConsent },
      select: { id: true, aiConsent: true },
    });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
