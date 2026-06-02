"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao enviar.");
      }
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle="Enviamos um link de recuperação para o e-mail informado."
        footer={
          <Link href="/login" className="font-medium text-gold-500 transition-colors hover:text-gold-600 hover:underline">
            Voltar ao login
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-money-100">
            <Check className="h-8 w-8 text-money-600" />
          </span>
          <p className="text-center text-sm text-slate-500 leading-relaxed">
            Se o e-mail <span className="font-medium text-slate-700">{email}</span> estiver cadastrado,
            você receberá um link para redefinir a senha. O link expira em 1 hora.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail para receber um link de recuperação"
      footer={
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-gold-500 transition-colors hover:text-gold-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "100ms" }}>
          <Label htmlFor="email">
            <Mail className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err}
          />
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
          style={{ animationDelay: "200ms" }}
          disabled={loading}
        >
          {loading ? "Enviando…" : "Enviar link de recuperação"}
        </Button>
      </form>
    </AuthShell>
  );
}
