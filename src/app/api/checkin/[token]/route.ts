import { prisma } from "@/lib/db";
import {
  requireUserId,
  assertWeddingAccess,
  requirePremiumWeddingFeature,
  errorResponse,
} from "@/lib/auth/guards";

type Params = { params: Promise<{ token: string }> };

// Check-in do dia do evento (feature Pro/Gestor). Marca presença real
// (attended) sem tocar no rsvpStatus, que guarda a intenção prévia.
// Rota autenticada: só membros do workspace dono da wedding podem usar.
export async function POST(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { token } = await params;

    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: token },
      select: { id: true, weddingId: true, attended: true },
    });
    if (!guest) return Response.json({ error: "NotFound" }, { status: 404 });

    await assertWeddingAccess(guest.weddingId, userId);
    await requirePremiumWeddingFeature(guest.weddingId);

    // Idempotente: segundo scan não falha, mas avisa que já havia check-in
    // (alreadyCheckedIn) para a recepção barrar QR reutilizado.
    if (guest.attended) {
      return Response.json({ ok: true, alreadyCheckedIn: true });
    }

    await prisma.guest.update({
      where: { id: guest.id },
      data: { attended: true },
    });
    return Response.json({ ok: true, alreadyCheckedIn: false });
  } catch (e) {
    return errorResponse(e);
  }
}
