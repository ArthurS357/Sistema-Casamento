"use client";
import { useActivePlan } from "@/lib/use-plan";
import { Paywall } from "@/components/paywall";

/**
 * Copy de venda por feature premium — fonte única consumida pelo Paywall.
 * Adicionar uma feature aqui é o único passo para ganhar um gate novo.
 */
const FEATURES = {
  gifts: {
    title: "Lista de Presentes",
    description:
      "Receba presentes via PIX com QR Code automático e uma página linda para compartilhar com seus convidados.",
    benefits: [
      "Página pública de presentes personalizada",
      "QR Code e PIX copia-e-cola gerados automaticamente",
      "Controle do que já foi presenteado",
    ],
  },
  tables: {
    title: "Mesas & Assentos",
    description:
      "Monte o mapa de mesas arrastando convidados, com alertas de conflito e afinidade para o lugar perfeito de cada um.",
    benefits: [
      "Arrastar-e-soltar para alocar convidados",
      "Alertas de conflito e afinidade entre convidados",
      "Mesas de qualquer formato e capacidade",
    ],
  },
  "reports-export": {
    title: "Exportação de dados",
    description: "Baixe a lista completa de convidados e finanças no plano Pro",
    benefits: [
      "Exporte convidados e RSVP em CSV",
      "Exporte despesas por categoria em CSV",
      "Leve seus dados para planilhas e fornecedores",
    ],
  },
} satisfies Record<string, { title: string; description: string; benefits: string[] }>;

export type PremiumFeature = keyof typeof FEATURES;

/**
 * Gate de plano (auditoria §1.4-2): substitui o branch
 * `isPremium === false → <Paywall/>` reimplementado em cada página premium.
 *
 * Estados, idênticos ao comportamento atual das páginas:
 * - `isPremium === null` (plano carregando): renderiza children — evita
 *   flash de paywall; os children exibem seus próprios skeletons.
 * - `false`: renderiza o <Paywall> com o copy da feature.
 * - `true`: renderiza children.
 *
 * Segurança: este gate é UX/conversão. O enforcement real continua
 * server-side nas rotas de API (plano verificado por requisição).
 *
 * `fallback`: substitui o <Paywall> no estado Free. Use `fallback={null}`
 * para gates inline (ex.: botões) onde o card de venda quebraria o layout
 * e a feature deve apenas sumir. Default (omitido) mantém o <Paywall>.
 *
 * Uso: <PremiumGate feature="gifts">…conteúdo premium…</PremiumGate>
 */
export function PremiumGate({
  feature,
  children,
  fallback,
}: {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isPremium } = useActivePlan();
  if (isPremium === false) {
    return <>{fallback !== undefined ? fallback : <Paywall {...FEATURES[feature]} />}</>;
  }
  return <>{children}</>;
}
