import { generateObject } from "ai";
import { z } from "zod";
import { liaModel, LIA_GUARDRAILS } from "@/lib/ai/lia-model";
import { prisma } from "@/lib/db";
import {
  requireUserId,
  assertWeddingAccess,
  requirePremiumWeddingFeature,
  enforceUserRateLimit,
  errorResponse,
} from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

/**
 * Esquema da proposta da Lia. A IA escolhe APENAS o par convidado→mesa
 * (agrupamento lógico). A mecânica de assento (qual Seat vazio) e a
 * capacidade são resolvidas server-side — nunca confiamos em ids vindos
 * do modelo sem validá-los contra os nossos próprios mapas.
 */
const AllocationSchema = z.object({
  allocations: z.array(
    z.object({
      guestId: z.string().describe("id do convidado elegível"),
      tableId: z.string().describe("id da mesa de destino"),
    }),
  ),
});

const SYSTEM_PROMPT =
  "Você é a Lia, uma assistente de casamentos. Aloque os convidados nas " +
  "mesas disponíveis respeitando o limite de assentos de cada mesa. Tente " +
  "manter grupos familiares (relações do tipo family, couple, friend) juntos " +
  "na mesma mesa e separe convidados com relação do tipo conflict. Responda " +
  "somente com pares guestId→tableId; não invente ids que não estejam na lista." + LIA_GUARDRAILS;

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await assertWeddingAccess(id, userId);
    // Lia é recurso premium (Pro/Gestor), igual ao módulo de Mesas.
    await requirePremiumWeddingFeature(id);
    // Chamada de IA é cara: aplica a cota tiered do plano.
    const limited = await enforceUserRateLimit(userId, "ai-allocate-tables");
    if (limited) return limited;

    // Golden rule: só convidados confirmados e SEM assento. Nunca mexe
    // em quem já está sentado.
    const guests = await prisma.guest.findMany({
      where: { weddingId: id, rsvpStatus: "confirmed", seatId: null },
      select: { id: true, name: true, notes: true, dietaryRestrictions: true },
    });

    // Mesas com seus assentos; assento vazio = sem guest relacionado.
    const tables = await prisma.table.findMany({
      where: { weddingId: id },
      select: {
        id: true,
        name: true,
        capacity: true,
        seats: {
          select: { id: true, number: true, guest: { select: { id: true } } },
          orderBy: { number: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fila de assentos vazios por mesa (fonte da verdade da capacidade).
    const freeSeatsByTable = new Map<string, string[]>();
    for (const t of tables) {
      const empty = t.seats.filter((s) => !s.guest).map((s) => s.id);
      if (empty.length > 0) freeSeatsByTable.set(t.id, empty);
    }

    const totalFree = [...freeSeatsByTable.values()].reduce((n, s) => n + s.length, 0);
    if (guests.length === 0 || totalFree === 0) {
      return Response.json({ allocated: 0, reason: guests.length === 0 ? "no-eligible-guests" : "no-free-seats" });
    }

    // Relações para a Lia agrupar famílias / separar conflitos.
    const relationships = await prisma.guestRelationship.findMany({
      where: { weddingId: id },
      select: { type: true, guestId: true, relatedId: true },
    });

    // Contexto enxuto p/ a IA: só mesas com vaga e contagem de assentos livres.
    const tablesForAI = [...freeSeatsByTable.entries()].map(([tableId, seats]) => {
      const t = tables.find((x) => x.id === tableId)!;
      return { tableId, name: t.name, availableSeats: seats.length };
    });

    const { object } = await generateObject({
      model: liaModel,
      schema: AllocationSchema,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({ guests, tables: tablesForAI, relationships }),
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 1500,
    });

    // Aplicação server-side: valida cada par contra nossos mapas e respeita
    // a capacidade consumindo a fila de assentos vazios.
    const eligibleGuestIds = new Set(guests.map((g) => g.id));
    const usedGuests = new Set<string>();
    const updates: { guestId: string; seatId: string }[] = [];

    for (const { guestId, tableId } of object.allocations) {
      if (!eligibleGuestIds.has(guestId) || usedGuests.has(guestId)) continue;
      const queue = freeSeatsByTable.get(tableId);
      if (!queue || queue.length === 0) continue; // mesa inexistente ou cheia
      const seatId = queue.shift()!;
      usedGuests.add(guestId);
      updates.push({ guestId, seatId });
    }

    // Fallback determinístico: convidados elegíveis que a IA não alocou
    // (ou descartados por mesa cheia) recebem qualquer assento livre restante,
    // para que "organizar mesas" sempre sente o máximo de gente possível.
    const remainingSeats = [...freeSeatsByTable.values()].flat();
    let cursor = 0;
    for (const g of guests) {
      if (usedGuests.has(g.id)) continue;
      const seatId = remainingSeats[cursor];
      if (!seatId) break; // acabaram os assentos livres
      cursor++;
      updates.push({ guestId: g.id, seatId });
      usedGuests.add(g.id);
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.guest.update({ where: { id: u.guestId }, data: { seatId: u.seatId } }),
        ),
      );
    }

    return Response.json({ allocated: updates.length });
  } catch (e) {
    return errorResponse(e);
  }
}
