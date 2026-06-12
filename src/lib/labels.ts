/**
 * Rótulos pt-BR para enums de domínio (auditoria U3 — idioma). Fonte única
 * de tradução: as colunas do banco continuam em inglês (canônico, estável),
 * a UI exibe português via estes mapas. Use `labelFor(map, value)` para
 * cair no próprio valor quando não houver tradução (fail-safe).
 */
import type { RsvpStatus, ExpenseCategory, TableShape } from "@/lib/validation/enums";

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  declined: "Recusado",
  maybe: "Talvez",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  venue: "Espaço",
  catering: "Buffet",
  decor: "Decoração",
  photography: "Fotografia",
  music: "Música",
  attire: "Trajes",
  transport: "Transporte",
  stationery: "Papelaria",
  favors: "Lembrancinhas",
  other: "Outros",
};

export const TABLE_SHAPE_LABELS: Record<TableShape, string> = {
  round: "Redonda",
  square: "Quadrada",
  rectangle: "Retangular",
  imperial: "Imperial",
  "u-shape": 'Em "U"',
};

/** Tradução com fallback no próprio valor (cobre dados legados fora do enum). */
export function labelFor(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
