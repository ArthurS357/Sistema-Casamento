"use client";

import Link from "next/link";
import { ArrowRight, CalendarHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

const BASE = "transition-[opacity,transform] duration-1000 ease-out";

export function LandingHero() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  // will-change only while animating; drop to `auto` once revealed so the
  // element leaves its GPU layer and text regains crisp subpixel rendering.
  const visible = isVisible
    ? "opacity-100 translate-y-0 will-change-auto"
    : "opacity-0 translate-y-8 will-change-[opacity,transform]";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gold-50 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gold-200/40 blur-3xl"
      />
      <div ref={ref} className="relative mx-auto max-w-4xl px-6 pb-24 pt-40 text-center sm:pt-48">
        <span
          className={cn(
            BASE,
            visible,
            "inline-flex items-center gap-2 rounded-full border border-gold-200 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold-700",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Planejamento de casamentos sem caos
        </span>

        <h1
          className={cn(
            BASE,
            visible,
            "mt-8 font-display text-5xl leading-[1.05] text-slate-900 sm:text-6xl md:text-7xl",
          )}
          style={{ transitionDelay: isVisible ? "80ms" : "0ms" }}
        >
          O seu grande dia,
          <span className="block italic text-gold-600">organizado ao detalhe.</span>
        </h1>

        <p
          className={cn(
            BASE,
            visible,
            "mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600",
          )}
          style={{ transitionDelay: isVisible ? "160ms" : "0ms" }}
        >
          Convidados, confirmações de presença, orçamento e disposição das mesas
          reunidos em um só lugar. Feito para noivos exigentes e assessores que
          não deixam nada ao acaso.
        </p>

        <div
          className={cn(
            BASE,
            visible,
            "mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row",
          )}
          style={{ transitionDelay: isVisible ? "240ms" : "0ms" }}
        >
          <Link href="/register">
            <Button variant="gold" size="lg" className="group w-full sm:w-auto">
              Começar gratuitamente
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Button>
          </Link>
          <Link href="#planos">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <CalendarHeart className="h-4 w-4" aria-hidden />
              Conhecer os planos
            </Button>
          </Link>
        </div>

        <p
          className={cn(BASE, visible, "mt-5 text-sm text-slate-500")}
          style={{ transitionDelay: isVisible ? "320ms" : "0ms" }}
        >
          Comece grátis. Sem cartão de crédito.
        </p>
      </div>
    </section>
  );
}
