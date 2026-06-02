import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

/**
 * Cliente de e-mail transacional (Resend).
 *
 * Degradação graciosa: sem RESEND_API_KEY o envio vira no-op (loga e
 * segue), para que registro, testes e build funcionem sem credenciais.
 * O disparo nunca deve quebrar o fluxo principal do usuário.
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Sistema Casamento <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export type SendResult = { sent: boolean; id?: string; skipped?: boolean };

/**
 * Envia o e-mail de boas-vindas. Erros são capturados e logados — o
 * onboarding do usuário não falha por causa de e-mail.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY ausente — welcome email pulado");
    return { sent: false, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: "Bem-vindos ao Sistema Casamento",
      react: WelcomeEmail({
        name: params.name,
        dashboardUrl: `${APP_URL}/dashboard`,
      }),
    });

    if (error) {
      console.error("[mail] falha ao enviar welcome email:", error);
      return { sent: false };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error("[mail] erro inesperado no welcome email:", e);
    return { sent: false };
  }
}

/**
 * Envia e-mail de recuperação de senha com link contendo token.
 * Mesma degradação graciosa do welcome email.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendResult> {
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY ausente — reset email pulado");
    return { sent: false, skipped: true };
  }

  const resetUrl = `${APP_URL}/reset-password?token=${params.token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: "Redefinir sua senha — Sistema Casamento",
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">Redefinir senha</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Olá${params.name ? `, ${params.name}` : ""}! Recebemos uma solicitação para redefinir sua senha.
          </p>
          <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #D4AF37; color: #0f172a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Redefinir minha senha
          </a>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            Este link expira em 1 hora. Se você não solicitou, ignore este e-mail.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[mail] falha ao enviar reset email:", error);
      return { sent: false };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error("[mail] erro inesperado no reset email:", e);
    return { sent: false };
  }
}

