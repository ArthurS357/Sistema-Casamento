/**
 * Gerador de "PIX Copia e Cola" estático (BR Code / EMV-MPM), conforme o
 * Manual de Padrões para Iniciação do Pix (Banco Central do Brasil).
 *
 * O payload é uma sequência de campos TLV (ID + tamanho + valor). Para um
 * QR estático, o valor pode vir embutido (campo 54) e o txid é "***".
 *
 * Referência: https://www.bcb.gov.br/estabilidadefinanceira/pix
 */

import { toReais } from "@/lib/money";

/** Parâmetros para montar o BR Code estático. */
export interface PixPayloadInput {
  /** Chave Pix recebedora (e-mail, CPF/CNPJ, telefone ou chave aleatória). */
  pixKey: string;
  /** Nome do recebedor (máx. 25 chars após sanitização). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 chars após sanitização). */
  merchantCity: string;
  /** Valor em centavos (BRL). Use 0/undefined para QR sem valor fixo. */
  amountCents?: number;
  /** Identificador da transação. Estático = "***". Máx. 25 chars. */
  txid?: string;
}

/** IDs dos campos EMV usados no BR Code. */
const ID = {
  PAYLOAD_FORMAT: "00",
  MERCHANT_ACCOUNT: "26",
  MERCHANT_CATEGORY: "52",
  CURRENCY: "53",
  AMOUNT: "54",
  COUNTRY: "58",
  MERCHANT_NAME: "59",
  MERCHANT_CITY: "60",
  ADDITIONAL_DATA: "62",
  CRC: "63",
} as const;

const GUI = "br.gov.bcb.pix";
const CURRENCY_BRL = "986";
const COUNTRY_BR = "BR";
const MCC_DEFAULT = "0000";

/**
 * Codifica um campo TLV: id (2) + tamanho zero-padded (2) + valor.
 * O tamanho é o número de caracteres do valor (espera-se ASCII/Latin).
 */
function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Remove acentos e caracteres fora do conjunto aceito pelo BR Code,
 * normaliza espaços e força maiúsculas. Aplica corte no tamanho máximo.
 */
function sanitizeText(input: string, maxLen: number): string {
  const ascii = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/[^A-Za-z0-9 ]/g, "") // mantém só alfanumérico + espaço
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return ascii.slice(0, maxLen);
}

/**
 * CRC16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF) — algoritmo
 * exigido pelo BR Code para o campo 63. Vetor de validação conhecido:
 * crc16("123456789") === 0x29B1.
 */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Converte centavos em string decimal com 2 casas (ex.: 12345 -> "123.45"). */
function formatAmount(amountCents: number): string {
  return toReais(amountCents).toFixed(2);
}

/**
 * Gera a string completa do "Pix Copia e Cola" estático.
 *
 * @throws {Error} se a chave Pix estiver vazia.
 */
export function generatePixPayload(input: PixPayloadInput): string {
  const pixKey = input.pixKey.trim();
  if (!pixKey) throw new Error("pixKey é obrigatória para gerar o BR Code");

  const merchantName = sanitizeText(input.merchantName, 25) || "RECEBEDOR";
  const merchantCity = sanitizeText(input.merchantCity, 15) || "BRASIL";
  const txid = sanitizeText(input.txid ?? "***", 25) || "***";

  const merchantAccount = field(ID.MERCHANT_ACCOUNT, field("00", GUI) + field("01", pixKey));
  const additionalData = field(ID.ADDITIONAL_DATA, field("05", txid));

  const parts = [
    field(ID.PAYLOAD_FORMAT, "01"),
    merchantAccount,
    field(ID.MERCHANT_CATEGORY, MCC_DEFAULT),
    field(ID.CURRENCY, CURRENCY_BRL),
  ];

  if (input.amountCents && input.amountCents > 0) {
    parts.push(field(ID.AMOUNT, formatAmount(input.amountCents)));
  }

  parts.push(
    field(ID.COUNTRY, COUNTRY_BR),
    field(ID.MERCHANT_NAME, merchantName),
    field(ID.MERCHANT_CITY, merchantCity),
    additionalData,
  );

  // O CRC é calculado sobre todo o payload acrescido de "6304".
  const partial = `${parts.join("")}${ID.CRC}04`;
  return `${partial}${crc16(partial)}`;
}
