import { prisma } from "@/lib/db";
import { requireUserId, enforceUserRateLimit, errorResponse } from "@/lib/auth/guards";

export async function GET() {
  try {
    const userId = await requireUserId();
    // Export completo é pesado: aplica cota por plano para conter abuso.
    const limited = await enforceUserRateLimit(userId, "extract");
    if (limited) return limited;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        aiConsent: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            role: true,
            createdAt: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                createdAt: true,
                weddings: {
                  select: {
                    id: true,
                    title: true,
                    date: true,
                    partner1Name: true,
                    partner2Name: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const payload = JSON.stringify({ extractedAt: new Date().toISOString(), user }, null, 2);
    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="meus-dados.json"',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
