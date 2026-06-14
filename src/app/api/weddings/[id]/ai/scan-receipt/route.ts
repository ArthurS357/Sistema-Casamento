import { generateObject } from "ai";
import { z } from "zod";
import { liaModel, LIA_GUARDRAILS } from "@/lib/ai/lia-model";
import { ExpenseCategory } from "@/lib/validation/enums";
import {
  requireUserId,
  assertWeddingAccess,
  requirePremiumWeddingFeature,
  requireAiConsent,
  enforceUserRateLimit,
  AuthError,
  errorResponse,
} from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 30;

// Tipos aceitos e teto de payload (~8MB de base64 ≈ 6MB de imagem). Evita
// abuso de memória e uploads que o modelo recusaria de qualquer forma.
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BASE64_LEN = 8_000_000;

const BodySchema = z.object({
  // Data URL (data:image/...;base64,XXXX) ou base64 puro.
  image: z.string().min(32).max(MAX_BASE64_LEN),
});

/**
 * A Lia lê o comprovante e extrai os campos de uma despesa. O modelo devolve
 * dados crus; o servidor sanea (centavos, categoria do enum, data ISO) — nunca
 * confiamos no formato exato vindo do LLM.
 */
const ReceiptSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(0)
    .describe("valor TOTAL do comprovante em CENTAVOS (ex.: R$ 1.250,90 = 125090)"),
  description: z
    .string()
    .describe("estabelecimento/fornecedor ou item principal do comprovante"),
  category: ExpenseCategory.describe(
    "categoria de despesa de casamento mais provável para este comprovante",
  ),
  dueDate: z
    .string()
    .nullable()
    .describe("data do comprovante em formato YYYY-MM-DD; null se não houver"),
});

const SYSTEM_PROMPT =
  "Você é a Lia, assessora de casamentos com visão computacional. Receberá a " +
  "imagem de um comprovante, recibo ou orçamento. Extraia o valor TOTAL (em " +
  "centavos), uma descrição curta (fornecedor/estabelecimento ou item), a " +
  "categoria de despesa de casamento mais provável e a data do documento. Se " +
  "algum campo não for legível, use o valor mais plausível (0 para valor, null " +
  "para data). Não invente fornecedores que não estejam na imagem." + LIA_GUARDRAILS;

/** Separa o base64 e o media type de uma data URL; aceita base64 puro também. */
function parseImage(input: string): { data: string; mediaType: string } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(input);
  const mediaType = match?.[1];
  const data = match?.[2];
  if (mediaType && data) {
    return { data, mediaType };
  }
  // base64 puro sem cabeçalho: assume JPEG (Gemini detecta pelo conteúdo).
  return { data: input, mediaType: "image/jpeg" };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    await requirePremiumWeddingFeature(id);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-scan-receipt");
    if (limited) return limited;

    const { image } = BodySchema.parse(await req.json());
    const { data, mediaType } = parseImage(image);
    if (!ALLOWED_MEDIA.includes(mediaType)) {
      throw new AuthError(400, "Formato de imagem não suportado. Use JPG, PNG ou WEBP.");
    }

    const { object } = await generateObject({
      model: liaModel,
      schema: ReceiptSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Leia este comprovante e extraia os dados da despesa." },
            { type: "image", image: data, mediaType },
          ],
        },
      ],
      temperature: 0.1,
      maxOutputTokens: 500,
    });

    // Saneamento server-side antes de devolver ao formulário.
    const amountCents = Math.max(0, Math.min(Math.round(object.amountCents), 1_000_000_000));
    const description = object.description?.trim().slice(0, 500) || null;
    const category = ExpenseCategory.options.includes(object.category) ? object.category : "other";
    const parsedDate = object.dueDate ? new Date(object.dueDate) : null;
    const dueDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null;

    return Response.json({ amountCents, description, category, dueDate });
  } catch (e) {
    return errorResponse(e);
  }
}
