import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessPremiumFeatures, canAccessManagerAnalytics } from "@/lib/permissions";
import { enforceRateLimitFor, limiterForTier, type RateTier } from "@/lib/rate-limit";

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new AuthError(401, "Unauthorized");
  return id;
}

/**
 * Autorização multi-tenant: o usuário só acessa a wedding se for
 * membro do workspace (tenant) dono dela. Não há mais dono único.
 */
export async function assertWeddingAccess(
  weddingId: string,
  userId: string,
): Promise<void> {
  const w = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: { workspaceId: true },
  });
  if (!w) throw new AuthError(404, "Wedding not found");
  const member = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: w.workspaceId } },
    select: { id: true },
  });
  if (!member) throw new AuthError(403, "Forbidden");
}

export async function requireWeddingAccess(weddingId: string): Promise<string> {
  const userId = await requireUserId();
  await assertWeddingAccess(weddingId, userId);
  return userId;
}

/** Plano do workspace dono da wedding. 404 se a wedding não existir. */
export async function getWeddingPlan(weddingId: string): Promise<string> {
  const w = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: { workspace: { select: { plan: true } } },
  });
  if (!w) throw new AuthError(404, "Wedding not found");
  return w.workspace.plan;
}

/**
 * Paywall server-side: bloqueia features premium (Presentes, Mesas) quando
 * o plano dono da wedding é Free. Assume que o acesso já foi validado.
 */
export async function requirePremiumWeddingFeature(weddingId: string): Promise<void> {
  const plan = await getWeddingPlan(weddingId);
  if (!canAccessPremiumFeatures(plan)) {
    throw new AuthError(403, "Recurso disponível apenas nos planos Pro e Gestor.");
  }
}

/**
 * Paywall server-side do Dashboard Analítico: exclusivo do plano Gestor
 * (regra de negócio espelhada de canAccessManagerAnalytics, usada no client).
 */
export async function requireManagerAnalyticsFeature(weddingId: string): Promise<void> {
  const plan = await getWeddingPlan(weddingId);
  if (!canAccessManagerAnalytics(plan)) {
    throw new AuthError(403, "Recurso disponível apenas no plano Gestor.");
  }
}

/**
 * Resolve o workspace ativo do usuário (o mais antigo = o pessoal,
 * criado no registro). Ponto único para futura troca de tenant ativo.
 */
export async function getActiveWorkspaceId(userId: string): Promise<string> {
  const m = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (!m) throw new AuthError(403, "No workspace");
  return m.workspaceId;
}

/**
 * Resolve o tier de rate limit do usuário: admin do sistema > plano do
 * workspace ativo (pessoal). Decisão de cota → lê o banco, não confia no JWT.
 */
async function resolveUserTier(userId: string): Promise<RateTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true },
  });
  if (user?.systemRole === "admin") return "admin";

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspace: { select: { plan: true } } },
  });
  const plan = membership?.workspace.plan;
  if (plan === "gestor") return "gestor";
  if (plan === "pro") return "pro";
  return "free";
}

/**
 * Rate limit tiered para rotas autenticadas pesadas. Chaveia por userId e
 * aplica a cota do plano (Free/Pro/Gestor/Admin). Retorna uma `Response` 429
 * quando estoura, ou `null` para seguir o handler.
 *
 * @example
 *   const userId = await requireUserId();
 *   const limited = await enforceUserRateLimit(userId, "extract");
 *   if (limited) return limited;
 */
export async function enforceUserRateLimit(
  userId: string,
  scope: string,
): Promise<Response | null> {
  const tier = await resolveUserTier(userId);
  return enforceRateLimitFor(userId, limiterForTier(tier), scope);
}

export function errorResponse(e: unknown): Response {
  if (e instanceof AuthError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && e.name === "ZodError")
    return Response.json({ error: "ValidationError", issues: JSON.parse(e.message) }, { status: 400 });
  console.error(e);
  return Response.json({ error: "InternalError" }, { status: 500 });
}
