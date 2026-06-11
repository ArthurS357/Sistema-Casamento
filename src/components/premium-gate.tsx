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
 * Uso: <PremiumGate feature="gifts">…conteúdo premium…</PremiumGate>
 */
export function PremiumGate({
  feature,
  children,
}: {
  feature: PremiumFeature;
  children: React.ReactNode;
}) {
  const { isPremium } = useActivePlan();
  if (isPremium === false) return <Paywall {...FEATURES[feature]} />;
  return <>{children}</>;
}
