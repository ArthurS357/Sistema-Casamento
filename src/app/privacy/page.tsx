import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection, LegalList } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Política de Privacidade — Atelier",
  description:
    "Como o Atelier trata dados de noivos, assessores e convidados em conformidade com a LGPD.",
};

const LAST_UPDATED = "31 de maio de 2026";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      intro="Esta política explica como o Atelier coleta, usa, compartilha e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Quem somos e nossos papéis">
        <p>
          O Atelier é uma plataforma SaaS de planejamento de casamentos. Para fins da LGPD,
          atuamos em dois papéis distintos:
        </p>
        <LegalList
          items={[
            <>
              <strong>Controlador</strong> dos dados de cadastro dos usuários (noivos e
              assessores): nós decidimos como tratar os dados necessários para criar e manter
              a conta, autenticar o acesso e processar a cobrança.
            </>,
            <>
              <strong>Operador</strong> dos dados dos convidados: esses dados são inseridos e
              controlados pelo usuário que organiza o casamento. Tratamos esses dados apenas
              sob instrução dele e para a finalidade de viabilizar o evento.
            </>,
          ]}
        />
        <p>
          Encarregado pelo Tratamento de Dados (DPO): você pode contatar nosso encarregado
          pelo e-mail <strong>privacidade@atelier.app</strong> para qualquer assunto
          relacionado a esta política.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <p>Coletamos apenas os dados necessários para operar o serviço:</p>
        <LegalList
          items={[
            <>
              <strong>Dados de conta (noivos/assessores):</strong> nome, e-mail e senha. Caso
              opte pelo login com o Google, recebemos seu nome, e-mail e identificador da conta.
            </>,
            <>
              <strong>Dados dos convidados:</strong> nome, status de confirmação (RSVP),
              restrições alimentares, vínculos entre convidados e alocação de assentos —
              inseridos pelo organizador do casamento.
            </>,
            <>
              <strong>Dados financeiros do evento:</strong> orçamento, despesas, vencimentos e
              valores pagos, registrados por você. Não armazenamos dados de cartão: o pagamento
              da assinatura é processado pela Stripe.
            </>,
            <>
              <strong>Dados técnicos:</strong> registros de acesso e cookies estritamente
              necessários para manter sua sessão autenticada.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Finalidades do tratamento">
        <LegalList
          items={[
            "Criar e manter a conta e o espaço de trabalho do usuário;",
            "Autenticar o acesso e proteger a conta contra uso indevido;",
            "Permitir que convidados confirmem presença (RSVP) por link exclusivo, sem necessidade de login;",
            "Organizar a logística do casamento: lista de convidados, mesas, assentos e restrições alimentares;",
            "Controlar o orçamento e as despesas do evento;",
            "Processar a assinatura do plano Premium e gerenciar a cobrança;",
            "Cumprir obrigações legais e regulatórias aplicáveis.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Base legal (Art. 7 e Art. 11 da LGPD)">
        <p>Cada tratamento se apoia em uma base legal adequada:</p>
        <LegalList
          items={[
            <>
              <strong>Execução de contrato</strong> (Art. 7, V): tratamento dos dados de conta e
              do evento, indispensáveis à prestação do serviço contratado.
            </>,
            <>
              <strong>Legítimo interesse</strong> (Art. 7, IX): segurança da informação e
              prevenção a fraudes, sempre balanceado com seus direitos.
            </>,
            <>
              <strong>Cumprimento de obrigação legal</strong> (Art. 7, II): guarda de registros
              e dados fiscais quando exigido por lei.
            </>,
            <>
              <strong>Consentimento</strong> (Art. 7, I): para dados sensíveis, como restrições
              alimentares de convidados que possam revelar condição de saúde ou crença, cabe ao
              organizador obter o consentimento do titular antes de inseri-los.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Compartilhamento de dados">
        <p>
          Não vendemos dados pessoais. Compartilhamos dados apenas com operadores essenciais à
          operação, sob contrato e obrigação de confidencialidade:
        </p>
        <LegalList
          items={[
            <><strong>Stripe</strong> — processamento de pagamentos da assinatura.</>,
            <><strong>Google</strong> — autenticação opcional via OAuth.</>,
            "Autoridades públicas, quando houver requisição legal válida.",
          ]}
        />
        <p>
          Alguns desses operadores podem tratar dados fora do Brasil. Nesses casos, exigimos
          garantias de proteção compatíveis com a LGPD (Art. 33).
        </p>
      </LegalSection>

      <LegalSection title="6. Segurança e isolamento dos dados">
        <p>Adotamos medidas técnicas e organizacionais para proteger os dados:</p>
        <LegalList
          items={[
            "Senhas armazenadas com hashing forte (argon2id) — nunca em texto puro;",
            "Tráfego protegido por criptografia em trânsito (HTTPS/TLS);",
            "Isolamento multi-tenant: cada casamento pertence a um espaço de trabalho, e o acesso exige vínculo (membership) explícito — nenhum usuário enxerga dados de outro;",
            "Acesso de convidados via link tokenizado, restrito ao próprio convidado e ao título e data do casamento;",
            "Controle de acesso por papéis (proprietário, administrador, membro).",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Retenção e exclusão">
        <LegalList
          items={[
            "Mantemos os dados enquanto a conta estiver ativa e pelo tempo necessário às finalidades acima;",
            "Ao excluir um casamento, seus convidados, despesas e mesas associados são removidos em cascata;",
            "Ao encerrar a conta, os dados são eliminados ou anonimizados, salvo retenção exigida por obrigação legal.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Seus direitos como titular (Art. 18 da LGPD)">
        <p>A qualquer momento você pode solicitar:</p>
        <LegalList
          items={[
            "Confirmação da existência de tratamento e acesso aos seus dados;",
            "Correção de dados incompletos, inexatos ou desatualizados;",
            "Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;",
            "Portabilidade dos dados a outro fornecedor;",
            "Informação sobre o compartilhamento de dados;",
            "Revogação do consentimento, quando esta for a base legal aplicável.",
          ]}
        />
        <p>
          Para exercer esses direitos, escreva para <strong>privacidade@atelier.app</strong>.
          Responderemos nos prazos previstos na LGPD.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Utilizamos apenas cookies estritamente necessários para manter sua sessão autenticada
          de forma segura. Não usamos cookies de publicidade ou rastreamento de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações nesta política">
        <p>
          Podemos atualizar esta política para refletir mudanças legais ou no serviço. Alterações
          relevantes serão comunicadas pelos nossos canais oficiais. Consulte também nossos{" "}
          <Link href="/terms" className="font-medium text-gold-700 underline-offset-2 hover:underline">
            Termos de Uso
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
