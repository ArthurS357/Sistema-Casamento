"use client";
import { useState } from "react";
import { HelpCircle, BookOpen, MessageCircleQuestion, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { faqs } from "@/lib/faq-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Panel = "faq" | "guide" | null;

const STEPS: { title: string; body: string }[] = [
  {
    title: "1. Crie seu casamento",
    body: "No Dashboard, clique em \"Novo Casamento\", informe título, noivos, data e orçamento. Ele vira o centro de tudo.",
  },
  {
    title: "2. Monte o checklist",
    body: "Em \"Checklist\", organize as tarefas por categoria e acompanhe o que já foi resolvido até o grande dia.",
  },
  {
    title: "3. Controle o orçamento",
    body: "Em \"Orçamento\", lance despesas e pagamentos. O painel mostra quanto já foi gasto e quanto ainda falta.",
  },
  {
    title: "4. Convide e confirme presença",
    body: "Em \"Convidados\", cadastre a lista e envie o link de RSVP — cada convidado confirma presença sozinho, por um link seguro.",
  },
  {
    title: "5. Receba presentes via PIX",
    body: "Cadastre sua chave PIX e monte a lista de presentes em \"Presentes\". As contribuições caem direto na sua conta.",
  },
];

/**
 * Acesso rápido a Ajuda (FAQ + Como Usar) como Floating Action Button no
 * canto inferior direito. Por decisão de produto, NÃO fica na sidebar.
 */
export function HelpFab() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);

  const openPanel = (p: Panel) => {
    setPanel(p);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Cluster do FAB (fora do fluxo, canto inferior direito) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 print:hidden">
        {menuOpen && (
          <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-white/60 bg-white/80 p-2 shadow-xl shadow-black/10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={() => openPanel("faq")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-gold-50 hover:text-gold-700"
            >
              <MessageCircleQuestion className="h-4 w-4 shrink-0 text-gold-500" />
              Perguntas frequentes
            </button>
            <button
              type="button"
              onClick={() => openPanel("guide")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-gold-50 hover:text-gold-700"
            >
              <BookOpen className="h-4 w-4 shrink-0 text-gold-500" />
              Como usar
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Fechar ajuda" : "Abrir ajuda"}
          aria-expanded={menuOpen}
          className="grid h-12 w-12 place-items-center rounded-full bg-gold-500 text-white shadow-lg shadow-gold-500/30 transition-all hover:bg-gold-600 hover:shadow-xl active:scale-95"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </button>
      </div>

      {/* FAQ */}
      <Dialog open={panel === "faq"} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-h-[82vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-gold-500" /> Perguntas frequentes
            </DialogTitle>
            <DialogDescription>O essencial sobre como o Felice funciona.</DialogDescription>
          </DialogHeader>
          <FaqAccordion />
        </DialogContent>
      </Dialog>

      {/* Como Usar */}
      <Dialog open={panel === "guide"} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent className="max-h-[82vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold-500" /> Como usar
            </DialogTitle>
            <DialogDescription>Um passo a passo rápido para tirar seu casamento do papel.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.title}>
                <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white/60">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-gold-700"
            >
              {faq.question}
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-gold-600 transition-transform duration-300", isOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {isOpen && (
              <p className="px-4 pb-4 -mt-1 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
