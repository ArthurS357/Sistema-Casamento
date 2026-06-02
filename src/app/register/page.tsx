"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [serverErr, setServerErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", termsAccepted: false },
    mode: "onTouched",
  });

  const termsAccepted = watch("termsAccepted");

  async function onSubmit(values: RegisterInput) {
    setServerErr(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerErr(body.error === "EmailTaken" ? "Email já cadastrado." : "Erro ao registrar.");
      return;
    }
    await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a planejar o grande dia em minutos"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-gold-500 transition-colors hover:text-gold-600 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "100ms" }}>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.name.message}</p>}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "200ms" }}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.email.message}</p>}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "300ms" }}>
          <Label htmlFor="password">Senha (mín. 8)</Label>
          <Input id="password" type="password" aria-invalid={!!errors.password} {...register("password")} />
          {errors.password && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.password.message}</p>}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500" style={{ animationDelay: "400ms" }}>
          <label htmlFor="termsAccepted" className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
            <Checkbox id="termsAccepted" aria-invalid={!!errors.termsAccepted} {...register("termsAccepted")} />
            <span className="leading-snug">
              Aceito os{" "}
              <Link href="/terms" target="_blank" className="font-medium text-gold-500 hover:underline">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-gold-500 hover:underline">
                Política de Privacidade
              </Link>
            </span>
          </label>
          {errors.termsAccepted && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.termsAccepted.message}</p>
          )}
        </div>

        {serverErr && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2" role="alert">
            {serverErr}
          </div>
        )}

        <Button
          type="submit"
          variant="gold"
          className="w-full animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
          style={{ animationDelay: "500ms" }}
          disabled={isSubmitting || !termsAccepted}
        >
          {isSubmitting ? "Criando…" : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
