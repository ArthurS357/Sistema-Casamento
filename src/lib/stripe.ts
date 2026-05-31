import Stripe from "stripe";
import type { PaidPlan } from "@/lib/plans";
import { PAID_PLANS } from "@/lib/plans";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
  { apiVersion: "2026-05-27.dahlia" },
);

export const STRIPE_PRICE_BY_PLAN: Record<PaidPlan, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  gestor: process.env.STRIPE_PRICE_GESTOR,
};

export function planForPriceId(priceId: string | undefined): PaidPlan | null {
  if (!priceId) return null;
  return PAID_PLANS.find((p) => STRIPE_PRICE_BY_PLAN[p] === priceId) ?? null;
}
