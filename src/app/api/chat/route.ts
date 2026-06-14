import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import {
  requireUserId,
  requirePremiumWorkspace,
  requireAiConsent,
  enforceUserRateLimit,
  errorResponse,
} from "@/lib/auth/guards";

// Streaming respostas em tempo real: runtime Node (Prisma nas guards não
// roda em Edge). maxDuration generoso para gerações mais longas.
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "Você é a Lia, a assessora de casamentos do Atelier do Sim. Fale português " +
  "do Brasil de forma gentil, calorosa e direta — respostas curtas e práticas, " +
  "sem enrolação. Ajude o casal com dúvidas sobre planejamento: cronograma, " +
  "orçamento, fornecedores, etiqueta, convidados e decoração. Quando fizer " +
  "sentido, devolva listas objetivas. Não invente preços exatos nem prometa " +
  "serviços; oriente com faixas e boas práticas. Se a pergunta fugir de " +
  "casamentos, redirecione com simpatia.";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    await requirePremiumWorkspace(userId);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-chat");
    if (limited) return limited;

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    return errorResponse(e);
  }
}
