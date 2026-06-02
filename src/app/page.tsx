import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Gestão de Casamentos, Lista de Presentes PIX e Site dos Noivos",
  description:
    "Organize todo o casamento em um só lugar: controle de orçamento e despesas, lista de presentes que cai direto no seu PIX e um site dos noivos com confirmação de presença (RSVP). Comece grátis.",
  alternates: { canonical: "/" },
};
import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingPainPoints } from "@/components/landing/pain-points";
import { LandingSolution } from "@/components/landing/solution";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingPainPoints />
        <LandingSolution />
        <LandingPricing />
      </main>
      <LandingFooter />
    </main>
  );
}
