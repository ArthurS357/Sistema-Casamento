import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Planos e preços — Atelier",
  description:
    "Free, Pro e Gestor: escolha o plano certo para testar, casar ou organizar vários casamentos. Cancele quando quiser.",
};

/**
 * Página dedicada de pricing. Substitui a antiga âncora `/#planos`,
 * reaproveitando a seção de planos da landing como fonte única.
 */
export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <LandingNav />
      <div className="pt-24">
        <LandingPricing />
      </div>
      <LandingFooter />
    </main>
  );
}
