import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PREMIUM_MONTHLY_BRL = 39;

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    cadence: "para sempre",
    tagline: "O essencial para começar a organizar hoje.",
    features: [
      "1 casamento ativo",
      "Lista de convidados e grupos",
      "RSVP por link, sem login",
      "Controle básico de orçamento",
    ],
    cta: "Começar grátis",
    href: "/register",
    featured: false,
  },
  {
    name: "Premium",
    price: `R$ ${PREMIUM_MONTHLY_BRL}`,
    cadence: "por mês",
    tagline: "Para assessores e quem leva a logística a sério.",
    features: [
      "Casamentos ilimitados",
      "Mesas, assentos e relacionamentos",
      "Relatórios avançados e exportações",
      "Restrições alimentares e vínculos",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    href: "/register",
    featured: true,
  },
];

export function LandingPricing() {
  return (
    <section id="planos" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Planos
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Comece grátis. Cresça quando precisar.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Sem fidelidade. Cancele a assinatura quando quiser, direto pelo painel.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 md:grid-cols-2">
          {plans.map((plan, i) => (
            <article
              key={plan.name}
              style={{ animationDelay: `${i * 100}ms` }}
              className={cn(
                "animate-fade-up relative rounded-3xl border bg-white p-8 shadow-sm",
                plan.featured
                  ? "border-gold-300 ring-1 ring-gold-200"
                  : "border-slate-200",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
                  Mais escolhido
                </span>
              )}

              <h3 className="font-display text-2xl text-slate-900">{plan.name}</h3>
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

              <Link href={plan.href} className="mt-8 block">
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
