import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Paleta editorial/luxo do Felice, compartilhada por todos os
 * templates via <Tailwind>. Centralizada aqui para manter consistência
 * visual entre boas-vindas, recuperação de senha e convites.
 */
export const emailTheme = {
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
} as const;

const BRAND = "Felice";
const TAGLINE = "Planejamento de casamentos, do primeiro convidado ao último brinde.";

export type BaseLayoutProps = {
  /** Texto de pré-visualização (inbox preview line). */
  preview: string;
  /** URL absoluta usada no rodapé para acesso à conta. */
  appUrl: string;
  /** Conteúdo do corpo do e-mail. */
  children: ReactNode;
};

/**
 * Casca compartilhada dos e-mails transacionais: <Html>, <Tailwind>,
 * cabeçalho com a marca e rodapé legal. Os templates específicos só
 * fornecem o miolo (children) e o texto de preview.
 */
export function BaseLayout({ preview, appUrl, children }: BaseLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={{ theme: { extend: emailTheme } }}>
        <Body className="bg-ivory font-serif text-ink m-0 py-10">
          <Container className="bg-white mx-auto max-w-[560px] rounded-lg border border-line px-12 py-12">
            {/* Cabeçalho — selo dourado + wordmark */}
            <Section className="text-center">
              <Text className="m-0 inline-block h-9 w-9 rounded-full bg-gold text-center text-lg leading-9 text-white">
                ♥
              </Text>
              <Text className="text-ink m-0 mt-3 text-xl tracking-[0.15em]">
                {BRAND}
              </Text>
            </Section>

            {children}

            {/* Rodapé — tagline, legal e copyright */}
            <Hr className="border-line my-10" />
            <Text className="text-muted m-0 text-center text-xs leading-5">
              {TAGLINE}
            </Text>
            <Text className="text-muted m-0 mt-3 text-center text-xs leading-5">
              Você recebeu este e-mail por ter uma conta no {BRAND}. Não foi
              você?{" "}
              <Link href={appUrl} className="text-gold underline">
                revise sua conta
              </Link>
              .
            </Text>
            <Text className="text-muted m-0 mt-3 text-center text-[10px] leading-4">
              © {new Date().getFullYear()} {BRAND}. Todos os direitos
              reservados.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BaseLayout;
