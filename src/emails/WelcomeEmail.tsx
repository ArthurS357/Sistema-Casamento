import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

export type WelcomeEmailProps = {
  /** Primeiro nome do casal/usuário para a saudação. */
  name: string;
  /** URL absoluta para o painel (CTA). */
  dashboardUrl: string;
  /** URL absoluta do app (rodapé). Default: origem do dashboard. */
  appUrl?: string;
};

/**
 * E-mail de boas-vindas transacional. Estética editorial/luxo do
 * Felice. Renderizado pelo Resend em src/lib/mail.ts.
 */
export function WelcomeEmail({ name, dashboardUrl, appUrl }: WelcomeEmailProps) {
  return (
    <BaseLayout
      preview="Bem-vindos ao Felice — sua jornada começa aqui"
      appUrl={appUrl ?? dashboardUrl}
    >
      <Heading className="text-ink mb-2 mt-8 text-center text-3xl font-normal leading-tight">
        Bem-vindos, {name}
      </Heading>

      <Hr className="border-line mx-auto my-8 w-16" />

      <Text className="text-muted m-0 text-center text-base leading-7">
        É uma honra acompanhar vocês neste capítulo. A partir de agora, cada
        detalhe — convidados, mesas, orçamento e confirmações — vive em um só
        lugar, organizado com o cuidado que esse dia merece.
      </Text>

      <Section className="my-10 text-center">
        <Button
          href={dashboardUrl}
          className="bg-ink rounded-md px-8 py-4 text-sm uppercase tracking-[0.2em] text-white"
        >
          Acessar meu painel
        </Button>
      </Section>

      <Text className="text-muted m-0 text-center text-sm leading-6">
        Comece criando seu casamento e importando a lista de convidados. Estamos
        aqui a cada passo.
      </Text>
    </BaseLayout>
  );
}

export default WelcomeEmail;
