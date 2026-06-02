"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

interface QA {
  question: string;
  answer: string;
}

const faqs: QA[] = [
  {
    question: "O que é o Casamento.app?",
    answer:
      "É uma plataforma completa para organizar o casamento em um só lugar: lista de convidados, confirmação de presença (RSVP) por link, controle de orçamento, disposição das mesas, site dos noivos e lista de presentes que cai direto no seu PIX.",
  },
  {
    question: "Posso testar de graça?",
    answer:
      "Sim. O plano Free é gratuito para sempre e permite organizar 1 casamento com lista de convidados, RSVP por link e controle básico de orçamento — sem precisar de cartão de crédito.",
  },
  {
    question: "Como funciona a lista de presentes?",
    answer:
      "Você cria sua lista de presentes e cada convidado contribui via PIX. O valor cai diretamente na sua conta, sem intermediários e sem taxas escondidas. Acompanhe tudo em tempo real pelo painel.",
  },
  {
    question: "A IA Lia está em quais planos?",
    answer:
      "A Lia, sua assistente de IA, está disponível nos planos Pro (acesso básico) e Gestor (acesso ilimitado). Ela ajuda a tirar dúvidas, gerar textos de convite e sugerir formas de organizar o evento.",
  },
];

export function LandingFaq() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Perguntas frequentes
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Ainda em dúvida?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            O essencial sobre como o Casamento.app funciona, sem letras miúdas.
          </p>
        </div>

        <div
          className={cn(
            "mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white transition-[opacity,transform] duration-1000 ease-out",
            isVisible
              ? "opacity-100 translate-y-0 will-change-auto"
              : "opacity-0 translate-y-8 will-change-[opacity,transform]",
          )}
        >
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;
            return (
              <div key={faq.question}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-slate-900 transition-colors hover:text-gold-700"
                  >
                    {faq.question}
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-gold-600 transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-6 pb-5 -mt-1 leading-relaxed text-slate-600"
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
