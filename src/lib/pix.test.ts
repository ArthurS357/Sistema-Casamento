import { describe, expect, test } from "vitest";
import { crc16, generatePixPayload } from "./pix";

describe("crc16", () => {
  test("matches the standard CCITT-FALSE check vector", () => {
    // Vetor canônico: CRC16/CCITT-FALSE("123456789") === 0x29B1.
    expect(crc16("123456789")).toBe("29B1");
  });

  test("always returns 4 uppercase hex chars", () => {
    expect(crc16("a")).toMatch(/^[0-9A-F]{4}$/);
    expect(crc16("")).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe("generatePixPayload", () => {
  const base = {
    pixKey: "noivos@example.com",
    merchantName: "João & Maria",
    merchantCity: "São Paulo",
    amountCents: 12345,
  };

  test("starts with the payload format indicator", () => {
    expect(generatePixPayload(base).startsWith("000201")).toBe(true);
  });

  test("embeds the Pix GUI and key", () => {
    const payload = generatePixPayload(base);
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("noivos@example.com");
  });

  test("formats the amount in reais with two decimals (field 54)", () => {
    // 12345 centavos -> "123.45", precedido de "54" + tamanho "06".
    expect(generatePixPayload(base)).toContain("5406123.45");
  });

  test("omits the amount field when value is zero/undefined", () => {
    const payload = generatePixPayload({ ...base, amountCents: 0 });
    expect(payload).not.toContain("5406");
    expect(payload).toContain("5303986"); // moeda ainda presente
  });

  test("sanitizes name/city: no accents, uppercase, ASCII only", () => {
    const payload = generatePixPayload(base);
    expect(payload).toContain("JOAO MARIA");
    expect(payload).toContain("SAO PAULO");
    expect(payload).not.toMatch(/[ãâàáçéõ]/i);
  });

  test("ends with a self-consistent CRC16 over the rest of the payload", () => {
    const payload = generatePixPayload(base);
    const body = payload.slice(0, -4);
    const crc = payload.slice(-4);
    expect(body.endsWith("6304")).toBe(true);
    expect(crc16(body)).toBe(crc);
  });

  test("throws when the Pix key is empty", () => {
    expect(() => generatePixPayload({ ...base, pixKey: "  " })).toThrow();
  });
});
