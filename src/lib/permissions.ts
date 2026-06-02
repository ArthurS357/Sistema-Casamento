import { Plan, isPaidPlan } from "./plans";

export function canManageMultipleWeddings(plan: Plan | string): boolean {
  return plan === "gestor";
}

export function canViewAdvancedAnalytics(plan: Plan | string): boolean {
  return plan === "pro" || plan === "gestor";
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
 * Limite de casamentos por plano. Gestor é ilimitado; demais planos
 * (free/pro) ficam restritos a 1 casamento — espelha a UI do dashboard
 * (`canManageMultipleWeddings`).
 */
export function canCreateWedding(plan: Plan | string, currentCount: number): boolean {
  if (canManageMultipleWeddings(plan)) return true;
  return currentCount < 1;
}
