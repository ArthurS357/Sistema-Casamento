import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type {
  GuestCreateSchema,
  GuestUpdateSchema,
  RelationshipCreateSchema,
} from "@/lib/validation/schemas";

/**
 * Contratos de resposta da API consumidos pelo client (auditoria §1.4-4).
 * Em vez de interfaces declaradas à mão nas páginas, os tipos são derivados
 * do Prisma (shape exato de cada rota, incluindo `include`s) e do Zod
 * (payloads de entrada via `z.input`).
 */

/**
 * `Response.json()` serializa `Date` como string ISO. Este mapped type
 * converte recursivamente os campos para o shape que o client realmente
 * recebe — sem mentir o tipo (`createdAt: Date`) do lado do fetch.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

/** GET /api/weddings/[id]/guests — inclui assento e mesa. */
export type ApiGuest = Serialized<
  Prisma.GuestGetPayload<{ include: { seat: { include: { table: true } } } }>
>;

/** GET /api/weddings/[id]/relationships — inclui os dois convidados. */
export type ApiRelationship = Serialized<
  Prisma.GuestRelationshipGetPayload<{ include: { guest: true; related: true } }>
>;

/**
 * GET /api/weddings/[id]/analytics — agregados do Dashboard Analítico
 * (plano Gestor). Valores monetários em centavos (convenção src/lib/money.ts),
 * exceto nas séries de gráfico (`costTimeline`), já convertidas para reais
 * para casar com a escala dos eixos Recharts.
 */
export type AnalyticsPayload = {
  rsvp: {
    confirmed: number;
    pending: number;
    declined: number;
    maybe: number;
    total: number;
  };
  /** Evolução semanal: confirmações acumuladas x pendentes restantes. */
  engagementTimeline: { week: string; confirmados: number; pendentes: number }[];
  finance: {
    /** Soma de Expense.amount (previsto), em centavos. */
    plannedCents: number;
    /** Soma de Expense.paid (realizado), em centavos. */
    paidCents: number;
    /** Saldo devedor de contas vencidas (dueDate < now e paid < amount), em centavos. */
    overdueCents: number;
  };
  /** Acumulado mensal previsto x realizado, em reais (escala do gráfico). */
  costTimeline: { mes: string; previsto: number; realizado: number }[];
  /** Despesas agrupadas por categoria: contratos = lançamentos, pendências = não quitados. */
  vendors: { fornecedor: string; contratos: number; pendencias: number }[];
};

/** Payload aceito pelo POST de convidados (lado de entrada do Zod, pré-coerção). */
export type GuestCreateInput = z.input<typeof GuestCreateSchema>;

/** Payload aceito pelo PUT de convidados. */
export type GuestUpdateInput = z.input<typeof GuestUpdateSchema>;

/** Payload aceito pelo POST de relacionamentos. */
export type RelationshipCreateInput = z.input<typeof RelationshipCreateSchema>;
