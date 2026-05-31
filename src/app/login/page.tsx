"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-6 left-6 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
            style={{ animationDelay: "100ms" }}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Entrar com Google
          </Button>
          <form onSubmit={submit} className="space-y-4">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "200ms" }}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "300ms" }}>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!err} />
            </div>
            {err && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 animate-in fade-in slide-in-from-top-2" role="alert">
                {err}
              </div>
            )}
            <Button type="submit" variant="gold" className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: "400ms" }} disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
            <p className="text-sm text-slate-500 text-center animate-in fade-in duration-500 fill-mode-both" style={{ animationDelay: "500ms" }}>
              Sem conta? <Link href="/register" className="text-gold-500 hover:underline">Cadastre-se</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
