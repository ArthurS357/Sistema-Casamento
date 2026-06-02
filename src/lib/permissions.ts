import { Plan, isPaidPlan, isPlan } from "./plans";

/**
 * Limites quantitativos por plano. `Infinity` = ilimitado.
 * Fonte única de verdade para casamentos e membros do workspace.
 * Gestor: casamentos limitados a 5 (assessoria), membros ilimitados.
 */
export const PLAN_LIMITS = {
  free: { weddings: 1, members: 1 },
  pro: { weddings: 2, members: 2 },
  gestor: { weddings: 5, members: Infinity },
} as const satisfies Record<Plan, { weddings: number; members: number }>;

/** Normaliza plano desconhecido para "free" (fail-safe restritivo). */
function limitsFor(plan: Plan | string): (typeof PLAN_LIMITS)[Plan] {
  return PLAN_LIMITS[isPlan(plan) ? plan : "free"];
}

export function canManageMultipleWeddings(plan: Plan | string): boolean {
  return plan === "gestor";
}

export function canViewAdvancedAnalytics(plan: Plan | string): boolean {
  return plan === "pro" || plan === "gestor";
}

/**
 * Dashboard Analítico avançado por casamento: exclusivo do plano Gestor
 * (engajamento de convidados, projeção de custos, relatório de fornecedores).
 */
export function canAccessManagerAnalytics(plan: Plan | string): boolean {
  return plan === "gestor";
}

export function requiresUpgradeBanner(plan: Plan | string): boolean {
  return plan === "free";
}

/**
 * Features premium (Presentes e Mesas/Seating): exclusivas de planos pagos.
 * Free fica bloqueado e é empurrado ao upgrade.
 */
export function canAccessPremiumFeatures(plan: Plan | string): boolean {
  return isPaidPlan(plan);
}

/**
 * Limite de casamentos por plano (ver PLAN_LIMITS): Free = 1, Pro = 2,
 * Gestor = 5.
 */
export function canCreateWedding(plan: Plan | string, currentCount: number): boolean {
  return currentCount < limitsFor(plan).weddings;
}

/** Teto de membros do workspace por plano: Free = 1, Pro = 2, Gestor = ilimitado. */
export function maxWorkspaceMembers(plan: Plan | string): number {
  return limitsFor(plan).members;
}

/**
 * Convites colaborativos: Free = só o dono (1). Pro = 1 membro extra (2 total).
 * Gestor = ilimitado.
 */
export function canAddWorkspaceMember(plan: Plan | string, currentCount: number): boolean {
  return currentCount < limitsFor(plan).members;
}
