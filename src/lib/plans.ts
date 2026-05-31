export const PAID_PLANS = ["pro", "gestor"] as const;
export const PLANS = ["free", "pro", "gestor"] as const;

export type Plan = (typeof PLANS)[number];
export type PaidPlan = (typeof PAID_PLANS)[number];

export function isPlan(value: string): value is Plan {
  return (PLANS as readonly string[]).includes(value);
}

export function isPaidPlan(value: string): value is PaidPlan {
  return (PAID_PLANS as readonly string[]).includes(value);
}
