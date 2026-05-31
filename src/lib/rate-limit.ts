import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting centralizado (Upstash Redis + sliding window).
 *
 * Degradação graciosa: sem UPSTASH_REDIS_REST_URL/TOKEN no ambiente
 * (dev local, CI, build), o módulo vira no-op — toda request passa.
 * Assim `next build`, testes e desenvolvimento não exigem credenciais.
 * Em produção, defina as variáveis para ativar a proteção real.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/** Resultado normalizado de uma checagem de limite. */
export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch (ms) em que a janela reseta. */
  reset: number;
};

const ALLOW_ALL: RateLimitResult = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
};

/** Cria um limiter ou `null` quando o Redis não está configurado. */
function makeLimiter(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
  prefix: string,
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter,
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

/**
 * Rotas de autenticação (login/registro): janela estrita para conter
 * brute-force e criação de contas em massa. 5 tentativas / 60s por IP.
 */
export const authLimiter = makeLimiter(
  Ratelimit.slidingWindow(5, "60 s"),
  "auth",
);

/**
 * Rotas públicas (RSVP): evita spam sem atrapalhar uso legítimo.
 * 10 requests / 10s por IP.
 */
export const publicLimiter = makeLimiter(
  Ratelimit.slidingWindow(10, "10 s"),
  "public",
);

/**
 * Extrai o IP do cliente dos headers de proxy (Vercel/edge).
 * Fallback "unknown" agrupa requests sem IP — aceitável para o limite.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Executa a checagem de limite. No-op (libera) quando o limiter é null.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) return ALLOW_ALL;
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}

/**
 * Helper para route handlers: roda a checagem e, se estourar, devolve
 * uma `Response` 429 pronta (com headers padrão). Retorna `null` quando
 * a request está liberada — o handler segue normalmente.
 *
 * @example
 *   const limited = await enforceRateLimit(req, authLimiter, "register");
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  req: Request,
  limiter: Ratelimit | null,
  scope: string,
): Promise<Response | null> {
  const ip = getClientIp(req);
  const result = await checkRateLimit(limiter, `${scope}:${ip}`);
  if (result.success) return null;

  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return Response.json(
    { error: "RateLimited", message: "Muitas requisições. Tente novamente em instantes." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
