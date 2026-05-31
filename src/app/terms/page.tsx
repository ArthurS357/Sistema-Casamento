import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection, LegalList } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: "Termos de Uso — Atelier",
  description:
    "Condições de uso da plataforma Atelier: responsabilidades, assinatura, cancelamento e limitações.",
};

const LAST_UPDATED = "31 de maio de 2026";

export default function TermsPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      intro="Estes Termos regem o uso da plataforma Atelier. Ao criar uma conta ou utilizar o serviço, você concorda com as condições abaixo."
      lastUpdated={LAST_UPDATED}
    >
      <LegalSection title="1. Aceitação dos termos">
        <p>
          Ao se cadastrar ou utilizar o Atelier, você declara ter lido e concordado com estes
          Termos de Uso e com nossa{" "}
          <Link href="/privacy" className="font-medium text-gold-700 underline-offset-2 hover:underline">
            Política de Privacidade
          </Link>
          . Se você não concordar, não utilize a plataforma.
        </p>
      </LegalSection>

      <LegalSection title="2. Descrição do serviço">
        <p>
          O Atelier é uma ferramenta de planejamento de casamentos que permite gerenciar lista
          de convidados, confirmações de presença (RSVP), orçamento, mesas e assentos. O serviço
          é oferecido em um plano gratuito e em um plano Premium por assinatura.
        </p>
      </LegalSection>

      <LegalSection title="3. Cadastro e conta">
        <LegalList
          items={[
            "Você deve ser maior de 18 anos e fornecer informações verdadeiras e atualizadas;",
            "Você é responsável por manter a confidencialidade das suas credenciais de acesso;",
            "Todas as atividades realizadas na sua conta são de sua responsabilidade;",
            "Notifique-nos imediatamente em caso de uso não autorizado da conta.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Conteúdo do usuário e responsabilidades">
        <p>
          Você mantém a titularidade de todo o conteúdo que insere — incluindo fotos, dados de
          convidados e informações do evento. Ao usar o Atelier, você declara e garante que:
        </p>
        <LegalList
          items={[
            "Possui o direito de inserir e tratar os dados dos convidados que cadastra;",
            "Obteve, quando aplicável, o consentimento dos titulares para tratar dados sensíveis (como restrições alimentares que revelem condição de saúde);",
            "Não publicará conteúdo ilegal, ofensivo ou que viole direitos de terceiros;",
            "É o controlador dos dados dos convidados, sendo o Atelier mero operador que age sob sua instrução.",
          ]}
        />
        <p>
          Concede-nos uma licença limitada para hospedar e processar esse conteúdo apenas com a
          finalidade de prestar o serviço.
        </p>
      </LegalSection>

      <LegalSection title="5. Uso aceitável">
        <p>Você concorda em não:</p>
        <LegalList
          items={[
            "Tentar acessar dados de outros usuários ou espaços de trabalho;",
            "Realizar engenharia reversa, sobrecarregar ou comprometer a segurança da plataforma;",
            "Utilizar o serviço para envio de spam ou comunicações não solicitadas a convidados;",
            "Revender ou sublicenciar o acesso sem autorização.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Assinatura, cobrança e cancelamento">
        <LegalList
          items={[
            "O plano gratuito não exige pagamento. O plano Premium é cobrado por assinatura recorrente, processada pela Stripe;",
            "A assinatura é renovada automaticamente ao fim de cada ciclo, até que seja cancelada;",
            "Você pode cancelar a assinatura a qualquer momento pelo painel de configurações; o acesso Premium permanece até o fim do ciclo já pago;",
            "Salvo exigência legal, valores já pagos referentes ao ciclo em curso não são reembolsados;",
            "Preços e funcionalidades dos planos podem mudar, com aviso prévio razoável.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Propriedade intelectual">
        <p>
          A plataforma, sua marca, código e design são de titularidade do Atelier. Estes Termos
          não transferem a você nenhum direito sobre a propriedade intelectual da plataforma,
          exceto o direito de uso conforme aqui descrito.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidade e limitação de responsabilidade">
        <LegalList
          items={[
            "O serviço é fornecido “no estado em que se encontra”, podendo haver interrupções para manutenção ou por fatores fora do nosso controle;",
            "Não nos responsabilizamos por decisões de planejamento, perdas ou danos indiretos decorrentes do uso da plataforma;",
            "Você é o único responsável pela exatidão dos dados inseridos e pela condução do seu evento;",
            "Na máxima extensão permitida em lei, nossa responsabilidade total limita-se ao valor pago pela assinatura nos 12 meses anteriores ao evento que originou a reclamação.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas
          que violem estes Termos. Após o encerramento, os dados são tratados conforme a Política
          de Privacidade.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações e legislação aplicável">
        <p>
          Podemos atualizar estes Termos periodicamente; alterações relevantes serão comunicadas.
          Estes Termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o
          foro do domicílio do usuário para dirimir eventuais controvérsias.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
