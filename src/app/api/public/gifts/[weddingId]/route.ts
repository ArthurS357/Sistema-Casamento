import { prisma } from "@/lib/db";
import { publicLimiter, enforceRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ weddingId: string }> };

/**
 * Endpoint público da galeria de presentes. Sem autenticação (convidados),
 * porém com rate limit. Retorna a chave Pix do casal — é o dado que o
 * convidado precisa para transferir, equivalente a imprimi-la no convite.
 */
export async function GET(req: Request, { params }: Params) {
  const limited = await enforceRateLimit(req, publicLimiter, "gifts");
  if (limited) return limited;

  const { weddingId } = await params;
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: {
      title: true,
      date: true,
      pixKey: true,
      gifts: {
        orderBy: [{ isPurchased: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          isPurchased: true,
        },
      },
    },
  });

  if (!wedding) return Response.json({ error: "NotFound" }, { status: 404 });
  return Response.json(wedding);
}
