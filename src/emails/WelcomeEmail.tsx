import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type WelcomeEmailProps = {
  /** Primeiro nome do casal/usuário para a saudação. */
  name: string;
  /** URL absoluta para o painel (CTA). */
  dashboardUrl: string;
};

/**
 * E-mail de boas-vindas transacional. Estética editorial/luxo:
 * tipografia serif, paleta marfim + dourado, espaçamento generoso.
 * Renderizado pelo Resend em src/lib/mail.ts.
 */
export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindos — sua jornada começa aqui</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                ivory: "#faf7f2",
                ink: "#1c1917",
                muted: "#78716c",
                gold: "#b08d57",
                line: "#e7e0d5",
              },
              fontFamily: {
                serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
              },
            },
          },
        }}
      >
        <Body className="bg-ivory font-serif text-ink m-0 py-10">
          <Container className="bg-white mx-auto max-w-[560px] rounded-lg border border-line px-12 py-14">
            <Text className="text-gold m-0 text-center text-xs uppercase tracking-[0.3em]">
              Sistema Casamento
            </Text>

            <Heading className="text-ink mb-2 mt-6 text-center text-3xl font-normal leading-tight">
              Bem-vindos, {name}
            </Heading>

            <Hr className="border-line mx-auto my-8 w-16" />

            <Text className="text-muted m-0 text-center text-base leading-7">
              É uma honra acompanhar vocês neste capítulo. A partir de agora,
              cada detalhe — convidados, mesas, orçamento e confirmações — vive
              em um só lugar, organizado com o cuidado que esse dia merece.
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
              Comece criando seu casamento e importando a lista de convidados.
              Estamos aqui a cada passo.
            </Text>

            <Hr className="border-line my-10" />

            <Text className="text-muted m-0 text-center text-xs leading-5">
              Você recebeu este e-mail porque criou uma conta no Sistema
              Casamento. Se não foi você,{" "}
              <Link href={dashboardUrl} className="text-gold underline">
                acesse sua conta
              </Link>{" "}
              para revisar.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
