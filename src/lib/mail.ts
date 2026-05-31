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
