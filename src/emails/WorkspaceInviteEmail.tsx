import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

export type WorkspaceInviteEmailProps = {
  /** Nome de quem está sendo convidado (pode ser vazio). */
  inviteeName?: string;
  /** Nome de quem convidou. */
  inviterName: string;
  /** Nome do workspace/casamento ao qual a pessoa foi adicionada. */
  workspaceName: string;
  /** URL absoluta do painel (CTA). */
  dashboardUrl: string;
  /** URL absoluta do app (rodapé). Default: origem do dashboard. */
  appUrl?: string;
};

/**
 * E-mail de convite para colaborar num workspace. Disparado quando um
 * owner/admin adiciona alguém como membro. Renderizado em src/lib/mail.ts.
 */
export function WorkspaceInviteEmail({
  inviteeName,
  inviterName,
  workspaceName,
  dashboardUrl,
  appUrl,
}: WorkspaceInviteEmailProps) {
  return (
    <BaseLayout
      preview={`${inviterName} convidou você para gerenciar ${workspaceName}`}
      appUrl={appUrl ?? dashboardUrl}
    >
      <Heading className="text-ink mb-2 mt-8 text-center text-3xl font-normal leading-tight">
        Você foi convidado
      </Heading>

      <Hr className="border-line mx-auto my-8 w-16" />

      <Text className="text-muted m-0 text-center text-base leading-7">
        Olá{inviteeName ? `, ${inviteeName}` : ""}! <strong>{inviterName}</strong>{" "}
        convidou você para ajudar a planejar o casamento de{" "}
        <strong>{workspaceName}</strong> no Felice. Agora vocês cuidam de
        cada detalhe juntos — convidados, mesas e confirmações, lado a lado.
      </Text>

      <Section className="my-10 text-center">
        <Button
          href={dashboardUrl}
          className="bg-ink rounded-md px-8 py-4 text-sm uppercase tracking-[0.2em] text-white"
        >
          Acessar o painel
        </Button>
      </Section>

      <Text className="text-muted m-0 text-center text-sm leading-6">
        Entre com a conta deste e-mail e o casamento já estará disponível para
        você.
      </Text>
    </BaseLayout>
  );
}

export default WorkspaceInviteEmail;
