import { streamText } from "ai";
import { z } from "zod";
import { liaModel, LIA_GUARDRAILS } from "@/lib/ai/lia-model";
import {
  requireUserId,
  assertWeddingAccess,
  requirePremiumWeddingFeature,
  requireAiConsent,
  enforceUserRateLimit,
  errorResponse,
} from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// Streaming em tempo real; runtime Node (guards usam Prisma, não roda em Edge).
export const maxDuration = 30;

// useCompletion (@ai-sdk/react) envia { prompt }. Tratamos como DADO do usuário.
const BodySchema = z.object({
  prompt: z.string().trim().min(2).max(2000),
});

const SYSTEM_PROMPT =
  "Você é a Lia, redatora de casamentos do Felice. O casal vai te pedir um " +
  "texto (ex.: Save the Date, mensagem de agradecimento aos padrinhos, convite, " +
  "votos, legenda). Escreva o texto final pronto para usar, em português do " +
  "Brasil, com tom elegante, caloroso e adequado à ocasião. Devolva apenas o " +
  "texto pedido — sem títulos, sem explicações, sem aspas em volta. Se o pedido " +
  "não tiver detalhes (nomes, datas), use marcadores claros como [Nome] e " +
  "[Data] para o casal completar." + LIA_GUARDRAILS;

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    await requirePremiumWeddingFeature(id);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-write-message");
    if (limited) return limited;

    const { prompt } = BodySchema.parse(await req.json());

    const result = streamText({
      model: liaModel,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
      topP: 0.9,
      maxOutputTokens: 1200,
    });

    // Protocolo de texto puro, casado com useCompletion({ streamProtocol: "text" }).
    return result.toTextStreamResponse();
  } catch (e) {
    return errorResponse(e);
  }
}
