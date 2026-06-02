import { prisma } from "@/lib/db";

// GET /api/health → liveness/readiness probe público (uptime, load balancer).
// Faz query levíssima (SELECT 1) pra confirmar que o Postgres responde.
// Sem dados sensíveis no payload. Sempre dinâmico (nunca cacheado).
export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      timestamp,
      env: process.env.NODE_ENV,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        timestamp,
        env: process.env.NODE_ENV,
      },
      { status: 503 },
    );
  }
}
