import { Plan } from "./plans";

export function canManageMultipleWeddings(plan: Plan | string): boolean {
  return plan === "gestor";
}

export function canViewAdvancedAnalytics(plan: Plan | string): boolean {
  return plan === "pro" || plan === "gestor";
}

export function requiresUpgradeBanner(plan: Plan | string): boolean {
  return plan === "free";
}
