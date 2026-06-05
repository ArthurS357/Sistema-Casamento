"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, PasswordInput } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao redefinir.");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Link inválido" subtitle="Este link de recuperação não é válido.">
        <div className="text-center">
          <Link href="/forgot-password" className="font-medium text-gold-500 hover:underline">
            Solicitar um novo link
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Senha redefinida!" subtitle="Você será redirecionado para o login.">
        <div className="flex flex-col items-center gap-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-money-100">
            <Check className="h-8 w-8 text-money-600" />
          </span>
          <p className="text-sm text-slate-500">Redirecionando em 3 segundos...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Escolha uma nova senha para sua conta"
      footer={
        <Link href="/login" className="font-medium text-gold-500 transition-colors hover:text-gold-600 hover:underline">
          Voltar ao login
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "100ms" }}>
          <Label htmlFor="password">
            <Lock className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            Nova senha
          </Label>
          <PasswordInput id="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!err} />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "200ms" }}>
          <Label htmlFor="confirm">Confirmar senha</Label>
          <PasswordInput id="confirm" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!err} />
        </div>
        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2" role="alert">
            {err}
          </div>
        )}
        <Button
          type="submit"
          variant="gold"
          className="w-full animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
          style={{ animationDelay: "300ms" }}
          disabled={loading}
        >
          {loading ? "Redefinindo…" : "Redefinir senha"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
