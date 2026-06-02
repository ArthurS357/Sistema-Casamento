import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail";
import { WorkspaceInviteEmail } from "@/emails/WorkspaceInviteEmail";

/**
 * Cliente de e-mail transacional (Resend) do Atelier do Sim.
 *
 * Cada template vive em src/emails/ como componente React Email e é
 * convertido em HTML premium via render() antes do envio.
 *
 * Degradação graciosa: sem RESEND_API_KEY o envio vira no-op (loga e
 * segue), para que registro, testes e build funcionem sem credenciais.
 * O disparo nunca deve quebrar o fluxo principal do usuário.
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Atelier do Sim <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export type SendResult = { sent: boolean; id?: string; skipped?: boolean };

/**
 * Envia um e-mail já renderizado em HTML, capturando e logando erros.
 * O disparo nunca propaga exceção — o fluxo do usuário não falha por
 * causa de e-mail. `label` aparece nos logs para diagnóstico.
 */
async function dispatch(
  label: string,
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!resend) {
    console.warn(`[mail] RESEND_API_KEY ausente — ${label} pulado`);
    return { sent: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[mail] falha ao enviar ${label}:`, error);
      return { sent: false };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error(`[mail] erro inesperado no ${label}:`, e);
    return { sent: false };
  }
}

/** E-mail de boas-vindas para novos usuários recém-registrados. */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const html = await render(
    WelcomeEmail({
      name: params.name,
      dashboardUrl: `${APP_URL}/dashboard`,
      appUrl: APP_URL,
    }),
  );

  return dispatch(
    "welcome email",
    params.to,
    "Bem-vindos ao Atelier do Sim",
    html,
  );
}

/** E-mail de recuperação de senha com link contendo token (expira em 1h). */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendResult> {
  const html = await render(
    ResetPasswordEmail({
      name: params.name,
      resetUrl: `${APP_URL}/reset-password?token=${params.token}`,
      appUrl: APP_URL,
    }),
  );

  return dispatch(
    "reset email",
    params.to,
    "Redefinir sua senha — Atelier do Sim",
    html,
  );
}

/** E-mail de convite para colaborar num workspace/casamento. */
export async function sendWorkspaceInviteEmail(params: {
  to: string;
  inviteeName?: string;
  inviterName: string;
  workspaceName: string;
}): Promise<SendResult> {
  const html = await render(
    WorkspaceInviteEmail({
      inviteeName: params.inviteeName,
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
      dashboardUrl: `${APP_URL}/dashboard`,
      appUrl: APP_URL,
    }),
  );

  return dispatch(
    "workspace invite email",
    params.to,
    `${params.inviterName} convidou você — Atelier do Sim`,
    html,
  );
}
