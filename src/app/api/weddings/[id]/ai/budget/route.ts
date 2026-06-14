import { generateObject } from "ai";
import { z } from "zod";
import { liaModel, LIA_GUARDRAILS } from "@/lib/ai/lia-model";
import { prisma } from "@/lib/db";
import { ExpenseCategory } from "@/lib/validation/enums";
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

// Entrada: orçamento total em centavos (convenção de dinheiro do projeto).
const BodySchema = z.object({
  total: z.number().int().positive().max(1_000_000_000),
});

/**
 * A Lia devolve a divisão em PORCENTAGENS por categoria (somando ~100); o
 * servidor converte para centavos a partir do total — evita que o modelo
 * precise fechar a conta em centavos e garante o total respeitado.
 */
const BudgetSchema = z.object({
  allocations: z
    .array(
      z.object({
        category: ExpenseCategory.describe("categoria de despesa"),
        percentage: z.number().min(0).max(100).describe("fatia do orçamento, 0–100"),
        description: z.string().describe("o que essa fatia cobre, em poucas palavras"),
      }),
    )
    .max(ExpenseCategory.options.length),
});

const SYSTEM_PROMPT =
  "Você é a Lia, assessora de casamentos. Distribua o orçamento total de um " +
  "casamento entre as categorias de despesa fornecidas, em porcentagens que " +
  "somem aproximadamente 100. Use proporções realistas do mercado brasileiro " +
  "(buffet/local costumam dominar). Não invente categorias fora da lista." + LIA_GUARDRAILS;

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    await requirePremiumWeddingFeature(id);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-budget");
    if (limited) return limited;

    const { total } = BodySchema.parse(await req.json());

    const { object } = await generateObject({
      model: liaModel,
      schema: BudgetSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        totalBRL: total / 100,
        categories: ExpenseCategory.options,
      }),
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 1000,
    });

    // Uma despesa por categoria; amount em centavos derivado do percentual.
    const seen = new Set<string>();
    const data = object.allocations
      .filter((a) => !seen.has(a.category) && seen.add(a.category))
      .map((a) => ({
        category: a.category,
        description: a.description?.slice(0, 500) || null,
        amount: Math.max(0, Math.round((total * a.percentage) / 100)),
        paid: 0,
        weddingId: id,
      }))
      .filter((e) => e.amount > 0);

    if (data.length === 0) return Response.json({ created: 0 });

    // Persiste o orçamento total informado na wedding e cria as despesas.
    const [, result] = await prisma.$transaction([
      prisma.wedding.update({ where: { id }, data: { budgetTotal: total } }),
      prisma.expense.createMany({ data }),
    ]);
    return Response.json({ created: result.count });
  } catch (e) {
    return errorResponse(e);
  }
}
