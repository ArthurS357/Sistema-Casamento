"use client";
import { CalendarHeart, Users, Wallet, Gift, ArrowRight, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Onboarding do plano Free sem casamentos (auditoria U5): troca o painel
 * vazio por um roteiro de primeiros passos. Só o passo 1 é acionável agora
 * (criar o casamento); os demais são prévia do que vem a seguir.
 */
export function SetupChecklist({ onCreateWedding }: { onCreateWedding: () => void }) {
  const steps = [
    {
      icon: CalendarHeart,
      title: "Crie seu casamento",
      desc: "Comece com a data, o orçamento e os nomes do casal.",
      action: true,
    },
    { icon: Users, title: "Adicione convidados", desc: "Monte a lista e acompanhe os RSVPs." },
    { icon: Wallet, title: "Planeje o orçamento", desc: "Registre despesas e controle o que já foi pago." },
    { icon: Gift, title: "Compartilhe os presentes", desc: "Crie sua lista com PIX e envie aos convidados." },
  ];

  return (
    <Card className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-500">
            Primeiros passos
          </span>
          <h2 className="mt-1 font-display text-2xl text-slate-900">
            Vamos preparar seu casamento ✨
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quatro passos rápidos para tirar o planejamento do papel.
          </p>
        </div>

        <ol className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className={
                  s.action
                    ? "flex items-center gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-4"
                    : "flex items-center gap-4 rounded-2xl border border-slate-100 p-4 opacity-70"
                }
              >
                <span
                  className={
                    s.action
                      ? "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-slate-900"
                      : "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400"
                  }
                >
                  {s.action ? <Icon className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-slate-800">
                    <span className="text-xs text-slate-400">{i + 1}.</span> {s.title}
                  </p>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
                {s.action && (
                  <Button variant="gold" onClick={onCreateWedding} className="shrink-0">
                    Começar <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
