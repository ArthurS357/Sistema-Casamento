import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { subMonths } from "date-fns";
import { prisma } from "@/lib/db";
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

/**
 * A Lia propõe etapas relativas (quantos meses ANTES do casamento), e o
 * servidor converte para dueDate real a partir da data do evento — date
 * math no modelo é frágil, então fica com o backend.
 */
const TasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().describe("nome curto da tarefa"),
        description: z.string().describe("o que fazer, em uma frase"),
        category: z.string().describe("ex.: Fornecedores, Cerimônia, Convidados"),
        monthsBeforeEvent: z
          .number()
          .int()
          .min(0)
          .max(24)
          .describe("quantos meses antes do casamento concluir esta tarefa"),
      }),
    )
    .max(20),
});

const SYSTEM_PROMPT =
  "Você é a Lia, assessora de casamentos. Gere um cronograma inicial de " +
  "tarefas essenciais de planejamento, distribuídas ao longo dos meses que " +
  "antecedem o casamento (do maior prazo ao menor). Seja prática e cubra as " +
  "etapas clássicas: definição de data e local, fornecedores, convites, " +
  "provas, documentação e detalhes finais. Português do Brasil.";

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    await requirePremiumWeddingFeature(id);
    await requireAiConsent(userId);
    const limited = await enforceUserRateLimit(userId, "ai-tasks");
    if (limited) return limited;

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      select: { date: true, title: true },
    });
    if (!wedding) throw new AuthError(404, "Wedding not found");

    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: TasksSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        weddingTitle: wedding.title,
        weddingDate: wedding.date.toISOString(),
      }),
    });

    const data = object.tasks.map((t) => ({
      title: t.title.slice(0, 200),
      description: t.description?.slice(0, 2000) || null,
      category: t.category?.slice(0, 60) || null,
      status: "PENDING",
      dueDate: subMonths(wedding.date, t.monthsBeforeEvent),
      weddingId: id,
    }));

    if (data.length === 0) return Response.json({ created: 0 });

    const result = await prisma.task.createMany({ data });
    return Response.json({ created: result.count });
  } catch (e) {
    return errorResponse(e);
  }
}
