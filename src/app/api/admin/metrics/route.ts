import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { errorResponse } from "@/lib/auth/guards";
import { PLANS, isPlan, type Plan } from "@/lib/plans";

type PlanCounts = Record<Plan, number>;

const emptyPlanCounts = (): PlanCounts =>
  Object.fromEntries(PLANS.map((p) => [p, 0])) as PlanCounts;

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const [totalUsers, weddingsCreated, weddingsCompleted, usersWithPlan] =
      await Promise.all([
        prisma.user.count(),
        prisma.wedding.count(),
        prisma.wedding.count({ where: { date: { lt: now } } }),
        // Plano efetivo do usuário = workspace pessoal (membership mais antigo).
        prisma.user.findMany({
          select: {
            id: true,
            memberships: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { workspace: { select: { plan: true } } },
            },
          },
        }),
      ]);

    const usersByPlan = usersWithPlan.reduce<PlanCounts>((acc, u) => {
      const raw = u.memberships[0]?.workspace.plan ?? "free";
      const plan: Plan = isPlan(raw) ? raw : "free";
      acc[plan] += 1;
      return acc;
    }, emptyPlanCounts());

    return Response.json({
      totalUsers,
      weddings: {
        created: weddingsCreated,
        completed: weddingsCompleted,
        upcoming: weddingsCreated - weddingsCompleted,
      },
      usersByPlan,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
