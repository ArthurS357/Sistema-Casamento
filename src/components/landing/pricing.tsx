import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/plans";

interface PlanCard {
  id: Plan;
  name: string;
  price: string;
  cadence: string;
  audience: string;
  tagline: string;
  features: string[];
  cta: string;
  featured: boolean;
}

const plans: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0,00",
    cadence: "para sempre",
    audience: "Para experimentar",
    tagline: "O básico para testar e organizar os primeiros passos.",
    features: [
      "1 casamento ativo",
      "Lista de convidados e grupos",
      "RSVP por link, sem login",
      "Controle básico de orçamento",
    ],
    cta: "Começar grátis",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 40,00",
    cadence: "por mês",
    audience: "Para casais",
    tagline: "Tudo para os noivos planejarem um casamento sem estresse.",
    features: [
      "1 casamento completo",
      "Mesas, assentos e relacionamentos",
      "Restrições alimentares e vínculos",
      "Relatórios e exportações",
      "Suporte por e-mail",
    ],
    cta: "Assinar Pro",
    featured: true,
  },
  {
    id: "gestor",
    name: "Gestor",
    price: "R$ 80,00",
    cadence: "por mês",
    audience: "Para assessorias",
    tagline: "Para profissionais que gerenciam vários casamentos ao mesmo tempo.",
    features: [
      "Casamentos ilimitados",
      "Tudo do plano Pro",
      "Visão consolidada de todos os eventos",
      "Múltiplos membros na equipe",
      "Suporte prioritário",
    ],
    cta: "Assinar Gestor",
    featured: false,
  },
];

export function LandingPricing() {
  return (
    <section id="planos" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Planos
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Preço claro. Sem surpresa.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Escolha pelo seu momento: testando, casando ou organizando casamentos de
            outras pessoas. Cancele quando quiser, direto pelo painel.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <article
              key={plan.id}
              style={{ animationDelay: `${i * 100}ms` }}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 ease-out relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm transition-all hover:scale-[1.02] hover:ring-2 hover:ring-offset-2 hover:ring-gold-300 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gold-400 cursor-pointer",
                plan.featured
                  ? "border-gold-300 ring-1 ring-gold-200 md:-translate-y-2"
                  : "border-slate-200",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
                  Mais escolhido
                </span>
              )}

              <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
                {plan.audience}
              </p>
              <h3 className="mt-2 font-display text-2xl text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">/ {plan.cadence}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-slate-700">
                    <Check
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0",
                        plan.featured ? "text-gold-600" : "text-money-600",
                      )}
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/register" className="mt-auto block pt-8">
                <Button
                  variant={plan.featured ? "gold" : "outline"}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
