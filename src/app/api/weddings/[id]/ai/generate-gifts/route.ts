import { generateObject } from "ai";
import { z } from "zod";
import { liaModel, LIA_GUARDRAILS } from "@/lib/ai/lia-model";
import { prisma } from "@/lib/db";
import {
  requireUserId,
  assertWeddingAccess,
  requirePremiumWeddingFeature,
  requireAiConsent,
  enforceUserRateLimit,
  errorResponse,
} from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 30;

const BodySchema = z.object({
  theme: z.string().trim().min(2).max(100),
});

/**
 * A Lia gera cotas de presente temáticas a um destino de lua de mel. O modelo
 * devolve preços em centavos; o servidor clampa e fatia os textos antes de
 * persistir — nunca confiamos no tamanho/valor cru do LLM.
 */
const GiftsSchema = z.object({
  gifts: z
    .array(
      z.object({
        title: z.string().describe("nome curto e encantador da cota (ex.: 'Jantar à beira do Sena')"),
        description: z.string().describe("uma frase descrevendo a experiência presenteada"),
        priceCents: z
          .number()
          .int()
          .min(0)
          .describe("preço sugerido da cota em CENTAVOS (ex.: R$ 250,00 = 25000)"),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT =
  "Você é a Lia, assessora de casamentos. Gere cerca de 15 cotas de presente " +
  "(experiências e itens) para uma lista de presentes de lua de mel, todas " +
  "temáticas ao destino informado pelo casal. Misture faixas de preço, do " +
  "simbólico ao especial, com valores realistas do mercado brasileiro em " +
  "centavos. Títulos curtos e afetivos; descrições de uma frase. Português do " +
  "Brasil. Não fuja do tema do destino." + LIA_GUARDRAILS;

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    await requirePremiumWeddingFeature(id);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-generate-gifts");
    if (limited) return limited;

    const { theme } = BodySchema.parse(await req.json());

    const { object } = await generateObject({
      model: liaModel,
      schema: GiftsSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({ destino: theme, quantidadeDesejada: 15 }),
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 2000,
    });

    const data = object.gifts
      .map((g) => ({
        title: g.title?.trim().slice(0, 120) || "",
        description: g.description?.trim().slice(0, 1000) || null,
        price: Math.max(0, Math.min(Math.round(g.priceCents), 1_000_000_000)),
        weddingId: id,
      }))
      .filter((g) => g.title.length > 0);

    if (data.length === 0) return Response.json({ created: 0 });

    const result = await prisma.gift.createMany({ data });
    return Response.json({ created: result.count });
  } catch (e) {
    return errorResponse(e);
  }
}
