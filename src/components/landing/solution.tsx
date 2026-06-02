"use client";

import {
  Users,
  MailCheck,
  Wallet,
  LayoutGrid,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Building2,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FeatureTag = { label: string; variant: "pro" | "gestor" | "ia" };

interface Feature {
  icon: typeof Users;
  title: string;
  body: string;
  tags?: FeatureTag[];
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Lista de convidados viva",
    body: "Uma fonte única de verdade. Adicione, agrupe e acompanhe restrições alimentares e vínculos entre convidados.",
  },
  {
    icon: MailCheck,
    title: "RSVP por link, sem login",
    body: "Cada convidado confirma presença em segundos pelo celular, por um link exclusivo e seguro. As respostas chegam organizadas.",
  },
  {
    icon: Wallet,
    title: "Orçamento sob controle",
    body: "Despesas, vencimentos e valores pagos lado a lado. Saiba a qualquer momento quanto falta e para onde vai cada real.",
  },
  {
    icon: LayoutGrid,
    title: "Mesas e assentos visuais",
    body: "Monte o salão arrastando convidados para as mesas, respeitando capacidade, formato e quem senta perto de quem.",
    tags: [{ label: "Pro", variant: "pro" }],
  },
  {
    icon: BarChart3,
    title: "Relatórios e exportações",
    body: "Confirmados, pendentes, custos por categoria — os números que importam, prontos para exportar quando você precisar.",
    tags: [{ label: "Pro", variant: "pro" }],
  },
  {
    icon: Sparkles,
    title: "Lia, sua assistente de IA",
    body: "Tire dúvidas, gere textos de convite e receba sugestões inteligentes de organização. Acesso básico no Pro, ilimitado no Gestor.",
    tags: [
      { label: "IA", variant: "ia" },
      { label: "Pro", variant: "pro" },
      { label: "Gestor", variant: "gestor" },
    ],
  },
  {
    icon: Building2,
    title: "Vários casamentos e analítico",
    body: "Gerencie até 5 casamentos ativos com dashboard analítico avançado por evento e equipe com membros ilimitados.",
    tags: [{ label: "Gestor", variant: "gestor" }],
  },
  {
    icon: ShieldCheck,
    title: "Cada casamento isolado",
    body: "Arquitetura multi-tenant: seus dados e os de cada evento ficam separados, acessíveis só por quem você autoriza.",
  },
];

const BASE = "transition-[opacity,transform] duration-1000 ease-out";

export function LandingSolution() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const visible = isVisible
    ? "opacity-100 translate-y-0 will-change-auto"
    : "opacity-0 translate-y-8 will-change-[opacity,transform]";

  return (
    <section id="solucao" className="py-24">
      <div ref={ref} className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Tudo em um só lugar
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Um ateliê digital para o casamento inteiro
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Centralize convidados, confirmações, finanças e logística — e chegue ao
            grande dia com a tranquilidade de quem sabe que está tudo certo.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className={cn(
                BASE,
                visible,
                "group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md",
              )}
              style={{ transitionDelay: isVisible ? `${(i % 3) * 80}ms` : "0ms" }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-600 transition-colors group-hover:bg-gold-100">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                {f.tags?.map((tag) => (
                  <Badge key={tag.label} variant={tag.variant}>
                    {tag.label}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 leading-relaxed text-slate-600">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
