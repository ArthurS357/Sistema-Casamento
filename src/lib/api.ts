/** Mensagem amigável padrão para HTTP 429 (rate limit estourado). */
export const RATE_LIMIT_MESSAGE =
  "Você fez muitas requisições. Aguarde um momento e tente novamente.";

/** Erro lançado quando o servidor responde 429 — permite UI específica. */
export class RateLimitError extends Error {
  constructor() {
    super(RATE_LIMIT_MESSAGE);
    this.name = "RateLimitError";
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
