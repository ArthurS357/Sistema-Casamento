import { Resend } from "resend";
import { render } from "@react-email/render";
import { formatBRL } from "@/lib/money";
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

/** Escapa conteúdo vindo do banco antes de interpolar em HTML de e-mail. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Casca HTML mínima compartilhada pelos lembretes do cron (texto simples estilizado). */
function reminderShell(title: string, body: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a">
  <p style="letter-spacing:.25em;text-transform:uppercase;font-size:11px;color:#b45309;margin:0 0 8px">Atelier do Sim</p>
  <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
  ${body}
  <p style="font-size:12px;color:#64748b;margin-top:32px">Você recebeu este aviso automático do Atelier do Sim.</p>
</div>`;
}

/**
 * Lembrete de RSVP pendente (cron, feature Pro/Gestor): enviado ao
 * convidado que ainda não respondeu quando faltam 30 e 14 dias.
 */
export async function sendRsvpReminderEmail(params: {
  to: string;
  guestName: string;
  weddingTitle: string;
  weddingDate: Date;
  rsvpUrl: string;
}): Promise<SendResult> {
  const dateLabel = params.weddingDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const html = reminderShell(
    `${esc(params.weddingTitle)} se aproxima`,
    `<p>Olá, ${esc(params.guestName)}!</p>
     <p>O grande dia é <strong>${dateLabel}</strong> e ainda não recebemos sua resposta.
     Os noivos precisam fechar a lista — confirme (ou avise que não poderá ir) em um clique:</p>
     <p style="margin:24px 0"><a href="${params.rsvpUrl}" style="background:#fbbf24;color:#0f172a;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Responder ao convite</a></p>`,
  );
  return dispatch("rsvp reminder", params.to, `Confirme sua presença — ${params.weddingTitle}`, html);
}

/**
 * Alerta de contas a vencer (cron, feature Pro/Gestor): enviado aos
 * membros do workspace listando despesas que vencem hoje ou em 7 dias.
 */
export async function sendExpenseReminderEmail(params: {
  to: string;
  recipientName: string | null;
  weddingTitle: string;
  items: { label: string; amountDueCents: number; dueLabel: string }[];
}): Promise<SendResult> {
  const rows = params.items
    .map(
      (i) =>
        `<li style="margin-bottom:8px">${esc(i.label)} — <strong>${formatBRL(i.amountDueCents)}</strong> (${i.dueLabel})</li>`,
    )
    .join("");
  const html = reminderShell(
    "Contas a vencer",
    `<p>Olá${params.recipientName ? `, ${esc(params.recipientName)}` : ""}!</p>
     <p>O casamento <strong>${esc(params.weddingTitle)}</strong> tem pagamentos pendentes chegando ao vencimento:</p>
     <ul style="padding-left:20px">${rows}</ul>
     <p><a href="${APP_URL}/dashboard" style="color:#b45309">Abrir painel do orçamento</a></p>`,
  );
  return dispatch(
    "expense reminder",
    params.to,
    `Contas a vencer — ${params.weddingTitle}`,
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
