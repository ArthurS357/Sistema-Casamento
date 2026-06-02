"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { canAccessPremiumFeatures } from "@/lib/permissions";

interface ActiveWorkspace {
  id: string;
  name: string;
  plan: string;
}

/**
 * Plano do workspace ativo (compartilha cache com o dashboard via
 * queryKey ["workspace"]). `isPremium` é null enquanto carrega para
 * evitar flash do paywall antes de saber o plano.
 */
export function useActivePlan(): {
  plan: string | undefined;
  isPremium: boolean | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery<ActiveWorkspace>({
    queryKey: ["workspace"],
    queryFn: () => apiFetch("/api/workspaces/active"),
  });
  return {
    plan: data?.plan,
    isPremium: data ? canAccessPremiumFeatures(data.plan) : null,
    isLoading,
  };
}
