"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setErr("Credenciais inválidas.");
    else router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para continuar planejando seu casamento"
      footer={
        <>
          Sem conta?{" "}
          <Link href="/register" className="font-medium text-gold-500 transition-colors hover:text-gold-600 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="mb-5 w-full animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
        style={{ animationDelay: "100ms" }}
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Entrar com Google
      </Button>

      <div className="mb-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "200ms" }}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "300ms" }}>
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!err} />
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
          style={{ animationDelay: "400ms" }}
          disabled={loading}
        >
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
