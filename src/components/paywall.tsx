"use client";
import Link from "next/link";
import { Crown, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PaywallProps {
  title: string;
  description: string;
  /** Benefícios listados como destaque do plano pago. */
  benefits?: string[];
}

/**
 * Empty state de monetização. Renderizado no lugar da feature quando o
 * workspace ativo é Free, em vez de quebrar a página com erros 403.
 */
export function Paywall({ title, description, benefits = [] }: PaywallProps) {
  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <Card className="overflow-hidden bg-white/50 backdrop-blur-xl border-white/50 shadow-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300" />
        <CardContent className="px-8 py-12 text-center">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gold-100/70 blur-xl" />
            <div className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-gold-100 to-gold-200 ring-1 ring-gold-300/60">
              <Lock className="h-8 w-8 text-gold-600" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-gold-300">
            <Crown className="h-3.5 w-3.5" /> Recurso PRO
          </span>

          <h2 className="mt-4 font-display text-3xl text-slate-900">{title}</h2>
          <p className="mt-2 text-slate-500 leading-relaxed">{description}</p>

          {benefits.length > 0 && (
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-money-600" />
                  {b}
                </li>
              ))}
            </ul>
          )}

          <Link href="/#planos" className="mt-8 inline-block w-full sm:w-auto">
            <Button variant="gold" size="lg" className="w-full sm:w-auto px-8 shadow-lg shadow-gold-200/50">
              <Crown className="h-5 w-5" /> Fazer Upgrade para o PRO
            </Button>
          </Link>
          <p className="mt-3 text-xs text-slate-400">Desbloqueie agora — leva menos de um minuto.</p>
        </CardContent>
      </Card>
    </div>
  );
}
