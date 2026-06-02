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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/schemas";
import { RATE_LIMIT_MESSAGE } from "@/lib/api";

type ModalType = "terms" | "privacy" | null;

export default function RegisterPage() {
  const router = useRouter();
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", termsAccepted: false, website: "" },
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
    if (res.status === 429) {
      setServerErr(RATE_LIMIT_MESSAGE);
      return;
    }
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
        {/* Honeypot anti-bot: off-screen + opacity-0 (não display:none, p/ enganar bots).
            aria-hidden + tabIndex -1 + autoComplete off escondem de humanos e leitores de tela.
            Humano nunca preenche; bot preenche tudo → RegisterSchema reprova. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

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
              <button
                type="button"
                onClick={() => setOpenModal("terms")}
                className="font-medium text-gold-500 hover:underline cursor-pointer"
              >
                Termos de Uso
              </button>{" "}
              e a{" "}
              <button
                type="button"
                onClick={() => setOpenModal("privacy")}
                className="font-medium text-gold-500 hover:underline cursor-pointer"
              >
                Política de Privacidade
              </button>
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

      {/* Modal: Termos de Uso */}
      <Dialog open={openModal === "terms"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Termos de Uso</DialogTitle>
            <DialogDescription>Atualizado em 31 de maio de 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <Section title="E-mails que enviamos">
              <p>
                Enviamos e-mails <strong>exclusivamente</strong> para os seguintes fins:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Avisos de vencimento ou renovação do seu plano de assinatura;</li>
                <li>Relatórios específicos que você mesmo solicitou ou configurou dentro da plataforma;</li>
                <li>E-mail de boas-vindas no momento do cadastro.</li>
              </ul>
              <p className="mt-2">
                Não enviamos newsletters, promoções ou comunicações de marketing sem seu consentimento explícito.
              </p>
            </Section>

            <Section title="Uso de Inteligência Artificial (IA)">
              <p>
                Nossa assistente <strong>Lia</strong> e outras funções baseadas em IA estão disponíveis de acordo com o seu plano:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Plano Free:</strong> sem acesso à IA;</li>
                <li><strong>Plano Pro:</strong> acesso básico à Lia e sugestões automáticas;</li>
                <li><strong>Plano Gestor:</strong> acesso completo a todas as funcionalidades de IA.</li>
              </ul>
              <p className="mt-2">
                O uso de IA pode envolver o processamento de dados do seu evento para gerar sugestões. Você pode revogar esse consentimento a qualquer momento nas configurações de privacidade.
              </p>
            </Section>

            <Section title="Cookies e persistência de sessão">
              <p>
                Utilizamos <strong>apenas cookies estritamente necessários</strong> para manter sua sessão autenticada de forma segura. Esses cookies:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>São criados no momento do login e expiram ao encerrar a sessão ou após período de inatividade;</li>
                <li>Armazenam somente o token de autenticação, nunca dados sensíveis do evento;</li>
                <li>Não são usados para rastreamento, publicidade ou análise de comportamento.</li>
              </ul>
            </Section>

            <Section title="Cadastro e responsabilidades">
              <p>Ao criar sua conta, você declara ser maior de 18 anos e concorda em fornecer informações verídicas. Você é responsável pela segurança das suas credenciais e por todas as atividades realizadas na conta.</p>
            </Section>

            <Section title="Assinatura e cancelamento">
              <p>Planos pagos (Pro e Gestor) são cobrados por assinatura recorrente via Stripe. Você pode cancelar a qualquer momento; o acesso permanece até o fim do ciclo pago. Valores já cobrados pelo ciclo em curso não são reembolsados.</p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Política de Privacidade */}
      <Dialog open={openModal === "privacy"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
            <DialogDescription>Atualizado em 31 de maio de 2026 · LGPD — Lei nº 13.709/2018</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <Section title="Dados que coletamos">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Conta:</strong> nome, e-mail e senha (armazenada com hash argon2id);</li>
                <li><strong>Evento:</strong> dados dos convidados, orçamento e mesas inseridos por você;</li>
                <li><strong>Técnicos:</strong> cookies de sessão estritamente necessários.</li>
              </ul>
            </Section>

            <Section title="E-mails que enviamos">
              <p>Enviamos e-mails <strong>somente</strong> para avisos de vencimento de plano e relatórios específicos que você configura. Não fazemos marketing sem consentimento.</p>
            </Section>

            <Section title="Uso de IA e dados processados">
              <p>
                Funções de IA (como a assistente Lia) processam dados do seu evento para gerar sugestões e relatórios. O nível de acesso varia conforme o plano. Você pode desativar esse processamento nas <strong>Configurações → Privacidade</strong>.
              </p>
            </Section>

            <Section title="Cookies">
              <p>
                Usamos <strong>apenas cookies de sessão</strong>, necessários para manter você autenticado com segurança. Nenhum cookie de publicidade ou rastreamento de terceiros é utilizado.
                <br />Os cookies são criados no login e expiram com a sessão ou após inatividade prolongada.
              </p>
            </Section>

            <Section title="Seus direitos (Art. 18 LGPD)">
              <ul className="list-disc pl-5 space-y-1">
                <li>Acesso, correção e portabilidade dos seus dados;</li>
                <li>Revogação de consentimento (IA) nas configurações;</li>
                <li>Download do extrato completo dos seus dados via <strong>Configurações → Privacidade → Baixar Extrato</strong>;</li>
                <li>Exclusão da conta e dos dados — contate <strong>privacidade@atelier.app</strong>.</li>
              </ul>
            </Section>

            <Section title="Compartilhamento">
              <p>Não vendemos dados. Compartilhamos apenas com operadores essenciais: Stripe (pagamentos) e Google (login OAuth opcional).</p>
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      {children}
    </div>
  );
}
