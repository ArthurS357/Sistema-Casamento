import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

export type ResetPasswordEmailProps = {
  /** Nome do usuário para a saudação (pode ser vazio). */
  name?: string;
  /** URL absoluta com o token de redefinição (CTA). */
  resetUrl: string;
  /** URL absoluta do app (rodapé). Default: origem do resetUrl. */
  appUrl?: string;
};

/**
 * E-mail de recuperação de senha. CTA dourado chamativo + aviso de
 * expiração. Renderizado pelo Resend em src/lib/mail.ts.
 */
export function ResetPasswordEmail({
  name,
  resetUrl,
  appUrl,
}: ResetPasswordEmailProps) {
  return (
    <BaseLayout
      preview="Redefina sua senha do Atelier do Sim"
      appUrl={appUrl ?? resetUrl}
    >
      <Heading className="text-ink mb-2 mt-8 text-center text-3xl font-normal leading-tight">
        Redefinir senha
      </Heading>

      <Hr className="border-line mx-auto my-8 w-16" />

      <Text className="text-muted m-0 text-center text-base leading-7">
        Olá{name ? `, ${name}` : ""}! Recebemos uma solicitação para redefinir a
        senha da sua conta. Toque no botão abaixo para criar uma nova senha com
        segurança.
      </Text>

      <Section className="my-10 text-center">
        <Button
          href={resetUrl}
          className="bg-gold rounded-md px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white"
        >
          Redefinir minha senha
        </Button>
      </Section>

      <Text className="text-muted m-0 text-center text-sm leading-6">
        Este link expira em 1 hora. Se você não solicitou a troca, ignore este
        e-mail — sua senha atual continua válida.
      </Text>

      <Text className="text-muted m-0 mt-6 text-center text-xs leading-5">
        Botão não funciona? Copie e cole este endereço no navegador:
        <br />
        <Link href={resetUrl} className="text-gold break-all underline">
          {resetUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export default ResetPasswordEmail;
