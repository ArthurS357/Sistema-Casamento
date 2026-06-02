"use client";
import { useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Download, Sparkles, AlertTriangle, Check, Loader2,
  User, CreditCard, Lock, Trash2, ShieldCheck, Camera,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "@/lib/api";
import { useActivePlan } from "@/lib/use-plan";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { NameInput } from "@/components/ui/name-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────
interface PrivacyData { id: string; aiConsent: boolean }
interface ProfileData {
  id: string; name: string | null; email: string;
  image: string | null; twoFactorEnabled: boolean;
  deleteRequestedAt: string | null; createdAt: string;
}
interface TwoFactorSetup { secret: string; otpauthUrl: string }

// ─── Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const qc = useQueryClient();
  const { plan, isLoading: planLoading } = useActivePlan();

  // Download state
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");
  const [toggleSuccess, setToggleSuccess] = useState(false);

  // Profile form
  const [editName, setEditName] = useState("");
  const [nameEditing, setNameEditing] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // 2FA state
  const [tfaOpen, setTfaOpen] = useState(false);
  const [tfaSetup, setTfaSetup] = useState<TwoFactorSetup | null>(null);
  const [tfaCode, setTfaCode] = useState("");
  const [tfaError, setTfaError] = useState<string | null>(null);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ─── Queries ────────────────────────────────────────────────
  const { data: profile, isLoading: loadingProfile } = useQuery<ProfileData>({
    queryKey: ["user-profile"],
    queryFn: () => apiFetch("/api/user/profile"),
    staleTime: 30_000,
  });

  const { data: privacy, isLoading: loadingPrivacy } = useQuery<PrivacyData>({
    queryKey: ["user-privacy"],
    queryFn: () => apiFetch("/api/user/privacy"),
  });

  // ─── Mutations ──────────────────────────────────────────────
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

  const updateName = useMutation({
    mutationFn: (name: string) =>
      apiFetch<ProfileData>("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      updateSession();
      setNameEditing(false);
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setPwdMsg({ type: "ok", text: "Senha alterada com sucesso!" });
      setCurrentPwd("");
      setNewPwd("");
      setTimeout(() => setPwdMsg(null), 3000);
    },
    onError: (e: Error) => {
      setPwdMsg({ type: "err", text: e.message });
    },
  });

  const enable2FA = useMutation({
    mutationFn: (data: { code: string; secret: string }) =>
      apiFetch("/api/user/2fa", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      setTfaOpen(false);
      setTfaSetup(null);
      setTfaCode("");
      setTfaError(null);
    },
    onError: (e: Error) => setTfaError(e.message),
  });

  const disable2FA = useMutation({
    mutationFn: () => apiFetch("/api/user/2fa", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-profile"] }),
  });

  const requestDelete = useMutation({
    mutationFn: () => apiFetch("/api/user/profile", { method: "DELETE" }),
    onSuccess: () => {
      setDeleteOpen(false);
      signOut({ callbackUrl: "/login" });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────
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

  const handleStart2FA = useCallback(async () => {
    setTfaError(null);
    setTfaCode("");
    try {
      const data = await apiFetch<TwoFactorSetup>("/api/user/2fa", { method: "POST" });
      setTfaSetup(data);
      setTfaOpen(true);
    } catch (e) {
      setTfaError(e instanceof Error ? e.message : "Erro ao gerar 2FA.");
    }
  }, []);

  const initials = (profile?.name ?? session?.user?.name ?? "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-xl font-bold text-white shadow-md">
                {loadingProfile ? <Skeleton className="h-16 w-16 rounded-full" /> : initials}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-600 transition-colors"
                title="Alterar foto (Em breve)"
                onClick={() => alert("Em breve!")}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              {nameEditing ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editName.trim()) updateName.mutate(editName.trim());
                  }}
                >
                  <NameInput
                    value={editName}
                    onValueChange={setEditName}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Button type="submit" size="sm" variant="gold" disabled={updateName.isPending}>
                    {updateName.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setNameEditing(false)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{profile?.name ?? session?.user?.name ?? "—"}</span>
                  <button
                    type="button"
                    className="text-xs text-gold-500 hover:underline"
                    onClick={() => { setEditName(profile?.name ?? ""); setNameEditing(true); }}
                  >
                    Editar
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500">{profile?.email ?? session?.user?.email ?? "—"}</p>
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-3">
              <Lock className="h-4 w-4 text-slate-400" />
              Alterar Senha
            </h4>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                changePassword.mutate({ currentPassword: currentPwd, newPassword: newPwd });
              }}
            >
              <div>
                <Label htmlFor="current-pwd">Senha atual</Label>
                <Input id="current-pwd" type="password" minLength={8} required value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="new-pwd">Nova senha</Label>
                <Input id="new-pwd" type="password" minLength={8} required value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              {pwdMsg && (
                <div className={`rounded-md border p-2.5 text-xs animate-in fade-in slide-in-from-top-2 ${
                  pwdMsg.type === "ok"
                    ? "border-money-200 bg-money-50 text-money-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}>
                  {pwdMsg.text}
                </div>
              )}
              <Button type="submit" size="sm" variant="outline" disabled={changePassword.isPending} className="gap-1.5">
                {changePassword.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                Alterar senha
              </Button>
            </form>
          </div>

          {/* Segurança — 2FA */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-3">
              <ShieldCheck className="h-4 w-4 text-gold-500" />
              Autenticação de Dois Fatores (2FA)
            </h4>
            {profile?.twoFactorEnabled ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-money-100 px-3 py-1 text-xs font-medium text-money-700">
                  <Check className="h-3 w-3" /> Ativo
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={disable2FA.isPending}
                  onClick={() => disable2FA.mutate()}
                >
                  Desativar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleStart2FA}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Habilitar 2FA
              </Button>
            )}
            {tfaError && !tfaOpen && (
              <p className="mt-2 text-xs text-red-500">{tfaError}</p>
            )}
          </div>
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
          {planLoading ? (
            <Skeleton className="h-6 w-20 rounded-full" />
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-semibold capitalize">
              {plan ?? "free"}
            </span>
          )}
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

      {/* ── Zona de Perigo ── */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both border-red-200" style={{ animationDelay: "320ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Ao excluir sua conta, ela ficará suspensa por <strong>30 dias</strong>. Se você fizer login
            nesse período, a exclusão será cancelada automaticamente. Após 30 dias, seus dados serão
            anonimizados permanentemente.
          </p>
          <Button
            id="delete-account-btn"
            variant="danger"
            size="sm"
            className="gap-1.5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir Conta
          </Button>
        </CardContent>
      </Card>

      {/* ── Modal 2FA ── */}
      <Dialog open={tfaOpen} onOpenChange={setTfaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold-500" />
              Ativar Autenticação 2FA
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
              e digite o código de 6 dígitos para confirmar.
            </DialogDescription>
          </DialogHeader>
          {tfaSetup && (
            <div className="flex flex-col items-center gap-6 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <QRCodeSVG value={tfaSetup.otpauthUrl} size={200} level="M" />
              </div>
              <p className="text-xs text-slate-400 break-all text-center max-w-xs font-mono">
                {tfaSetup.secret}
              </p>
              <form
                className="w-full space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  enable2FA.mutate({ code: tfaCode, secret: tfaSetup.secret });
                }}
              >
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={tfaCode}
                  onChange={(e) => setTfaCode(e.target.value)}
                  className="text-center tracking-[0.3em] text-xl font-mono"
                />
                {tfaError && (
                  <p className="text-xs text-red-500 text-center">{tfaError}</p>
                )}
                <Button type="submit" variant="gold" className="w-full" disabled={enable2FA.isPending || tfaCode.length !== 6}>
                  {enable2FA.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verificar e Ativar
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal Excluir Conta ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão de Conta
            </DialogTitle>
            <DialogDescription>
              Esta ação iniciará um período de carência de 30 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 leading-relaxed">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Sua conta ficará <strong>suspensa por 30 dias</strong>.</li>
                <li>Se fizer login nesse período, a exclusão será <strong>cancelada automaticamente</strong>.</li>
                <li>Após 30 dias sem login, seus dados serão <strong>anonimizados permanentemente</strong>.</li>
                <li>Casamentos e workspaces vinculados <strong>não serão apagados</strong>, apenas desvinculados.</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={requestDelete.isPending}
                onClick={() => requestDelete.mutate()}
                className="gap-1.5"
              >
                {requestDelete.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
