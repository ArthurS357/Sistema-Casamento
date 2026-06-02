"use client";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Download, Sparkles, AlertTriangle, Check, Loader2, User, CreditCard } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ──────────────────────────────────────────────────────
interface PrivacyData {
  id: string;
  aiConsent: boolean;
}

// ─── Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");
  const [toggleSuccess, setToggleSuccess] = useState(false);

  const { data: privacy, isLoading: loadingPrivacy } = useQuery<PrivacyData>({
    queryKey: ["user-privacy"],
    queryFn: () => apiFetch("/api/user/privacy"),
  });

  const toggleConsent = useMutation({
    mutationFn: (aiConsent: boolean) =>
      apiFetch<PrivacyData>("/api/user/privacy", {
        method: "PATCH",
        body: JSON.stringify({ aiConsent }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-privacy"] });
      setToggleSuccess(true);
      setTimeout(() => setToggleSuccess(false), 2000);
    },
  });

  const handleDownload = useCallback(async () => {
    setDownloadState("loading");
    try {
      const res = await fetch("/api/user/extract");
      if (!res.ok) throw new Error("Falha ao baixar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 3000);
    } catch {
      setDownloadState("idle");
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <h1 className="font-display text-3xl text-slate-900">Configurações</h1>
        <p className="mt-1 text-sm text-slate-400">Gerencie seu perfil, plano e privacidade.</p>
      </header>

      {/* ── Perfil ── */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "80ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-400" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-slate-500">Nome:</span> {session?.user?.name ?? "—"}</p>
          <p><span className="text-slate-500">Email:</span> {session?.user?.email ?? "—"}</p>
        </CardContent>
      </Card>

      {/* ── Plano ── */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "160ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-400" />
            Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p><span className="px-2 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold">free</span></p>
          <Button variant="gold" onClick={() => alert("Em breve.")}>Upgrade</Button>
        </CardContent>
      </Card>

      {/* ── Privacidade e Dados ── */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold-500" />
            Privacidade e Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ─ Toggle IA ─ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-500" />
                <span className="text-sm font-medium text-slate-800">Permitir uso de IA</span>
              </div>

              {loadingPrivacy ? (
                <Skeleton className="h-6 w-11 rounded-full" />
              ) : (
                <button
                  id="ai-consent-toggle"
                  type="button"
                  role="switch"
                  aria-checked={privacy?.aiConsent ?? true}
                  disabled={toggleConsent.isPending}
                  onClick={() => toggleConsent.mutate(!privacy?.aiConsent)}
                  className={`
                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
                    transition-colors duration-200 ease-in-out
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${privacy?.aiConsent ? "bg-gold-400" : "bg-slate-300"}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
                      transform transition-transform duration-200 ease-in-out
                      ${privacy?.aiConsent ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              )}
            </div>

            {/* Feedback de sucesso */}
            {toggleSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-money-600 animate-in fade-in slide-in-from-top-2 duration-300">
                <Check className="h-3.5 w-3.5" />
                Preferência atualizada com sucesso.
              </div>
            )}

            {/* Aviso contextual */}
            <div className={`
              flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed transition-colors duration-300
              ${privacy?.aiConsent === false
                ? "bg-amber-50 border border-amber-200 text-amber-700"
                : "bg-slate-50 border border-slate-100 text-slate-500"
              }
            `}>
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${privacy?.aiConsent === false ? "text-amber-500" : "text-slate-400"}`} />
              <p>
                {privacy?.aiConsent === false
                  ? "A IA (Lia) e funções que processam dados sensíveis estão temporariamente indisponíveis. Ative novamente para restaurar o acesso."
                  : "Se revogado, a IA (Lia) e funções que processam dados sensíveis ficarão temporariamente indisponíveis."
                }
              </p>
            </div>
          </div>

          {/* ─ Separador ─ */}
          <div className="border-t border-slate-100" />

          {/* ─ Extrato de Dados ─ */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <Download className="h-4 w-4 text-slate-400" />
                Extrato de Dados
              </h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Baixe um arquivo JSON contendo todos os seus dados pessoais armazenados na plataforma:
                perfil, workspaces e casamentos vinculados, conforme garantido pela LGPD (Art. 18).
              </p>
            </div>
            <Button
              id="download-extract-btn"
              variant="outline"
              size="sm"
              disabled={downloadState === "loading"}
              onClick={handleDownload}
              className="gap-2"
            >
              {downloadState === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando…
                </>
              ) : downloadState === "done" ? (
                <>
                  <Check className="h-4 w-4 text-money-600" />
                  Download concluído
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Baixar Extrato de Dados
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
