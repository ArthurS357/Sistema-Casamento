"use client";
import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { useActivePlan } from "@/lib/use-plan";
import { Button } from "@/components/ui/button";

interface PremiumBlurGateProps {
  title: string;
  description: string;
  /** Destino do CTA de upgrade. */
  ctaHref?: string;
  children: React.ReactNode;
}

/**
 * Gate de conversão por desfoque (auditoria — isca de upgrade).
 *
 * Diferente do <PremiumGate>, que substitui o conteúdo pelo <Paywall>,
 * este renderiza os children REAIS porém borrados, com um overlay de CTA
 * sobreposto. Mostrar que o dado existe converte melhor do que escondê-lo.
 *
 * Estados (espelham o PremiumGate):
 * - `isPremium === null` (carregando): children limpos, sem flash de overlay.
 * - `false` (Free): children borrados + overlay "Desbloqueie no Pro".
 * - `true` (Pro): children limpos.
 *
 * Segurança: gate puramente visual/UX. O enforcement real é server-side.
 * Os agregados exibidos são do próprio casamento do usuário (sem PII de
 * terceiros), então servi-los ao Free para borrar é aceitável.
 */
export function PremiumBlurGate({
  title,
  description,
  ctaHref = "/pricing",
  children,
}: PremiumBlurGateProps) {
  const { isPremium } = useActivePlan();

  if (isPremium !== false) return <>{children}</>;

  return (
    <div className="relative isolate">
      {/* Dado real, borrado e inerte — prova de que existe. */}
      <div
        aria-hidden
        className="blur-sm select-none pointer-events-none [filter:blur(5px)_saturate(0.85)]"
      >
        {children}
      </div>

      {/* Overlay de conversão. */}
      <div className="absolute inset-0 flex items-start justify-center bg-gradient-to-b from-white/40 via-white/55 to-white/75">
        <div className="sticky top-24 mx-4 mt-16 w-full max-w-md animate-fade-up rounded-2xl border border-white/60 bg-white/70 p-8 text-center shadow-2xl shadow-gold-200/40 backdrop-blur-xl">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-gold-100/70 blur-xl" />
            <div className="relative grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-gold-100 to-gold-200 ring-1 ring-gold-300/60">
              <Lock className="h-7 w-7 text-gold-600" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-gold-300">
            <Crown className="h-3.5 w-3.5" /> Recurso PRO
          </span>

          <h2 className="mt-4 font-display text-2xl text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

          <Link href={ctaHref} className="mt-6 inline-block w-full sm:w-auto">
            <Button variant="gold" size="lg" className="w-full px-8 shadow-lg shadow-gold-200/50 sm:w-auto">
              <Crown className="h-5 w-5" /> Desbloquear no Pro
            </Button>
          </Link>
          <p className="mt-3 text-xs text-slate-400">Seus números já estão prontos — veja tudo nítido em segundos.</p>
        </div>
      </div>
    </div>
  );
}
