"use client";
import { useState } from "react";
import Link from "next/link";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Banner "Upgrade para o Pro" dispensável. A decisão de exibir (plano que
 * exige upgrade) fica no Dashboard; aqui controlamos só a visibilidade local
 * via `useState` — o "X" fecha o banner pela sessão atual.
 */
export function UpgradeBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <Card className="relative rounded-3xl border-gold-300 bg-gold-50/60 backdrop-blur-md shadow-lg shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Fechar banner de upgrade"
        className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full text-gold-700/70 transition-colors hover:bg-gold-200/60 hover:text-gold-800"
      >
        <X className="h-4 w-4" />
      </button>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 pr-12">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-200/50 text-gold-700">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg text-slate-900">Upgrade para o Pro</h3>
            <p className="text-sm text-slate-500">Desbloqueie acesso total a convidados, RSVP e controle completo do grande dia.</p>
          </div>
        </div>
        <Link href="/settings" className="w-full sm:w-auto shrink-0">
          <Button variant="gold" className="w-full">Fazer Upgrade</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
