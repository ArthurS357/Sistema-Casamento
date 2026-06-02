"use client";

import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const { showBanner, accept, decline } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div
      id="cookie-consent-banner"
      role="dialog"
      aria-label="Consentimento de cookies"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6",
        "animate-in slide-in-from-bottom-4 fade-in duration-500",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-white/30 px-6 py-5 shadow-2xl sm:flex-row sm:items-center sm:gap-6",
          /* glassmorphism */
          "bg-slate-900/80 backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <div className="flex items-start gap-3 sm:items-center">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400/20 sm:mt-0">
            <Cookie className="h-4 w-4 text-gold-400" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-slate-200">
            <ShieldCheck
              className="mr-1 inline-block h-3.5 w-3.5 text-gold-400"
              aria-hidden
            />
            Deixe-nos utilizar cookies para obter uma melhor experiência e manter
            sua conta conectada de forma segura.
          </p>
        </div>

        <div className="flex shrink-0 gap-2 self-end sm:self-center">
          <Button
            id="cookie-decline-btn"
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={decline}
          >
            Recusar
          </Button>
          <Button
            id="cookie-accept-btn"
            variant="gold"
            size="sm"
            onClick={accept}
          >
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
