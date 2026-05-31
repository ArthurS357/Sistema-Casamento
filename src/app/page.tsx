import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
    <main className="min-h-screen flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
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
