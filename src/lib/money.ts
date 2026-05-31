export const toCents = (reais: number): number => Math.round(reais * 100);
export const toReais = (cents: number): number => cents / 100;
export const formatBRL = (cents: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
