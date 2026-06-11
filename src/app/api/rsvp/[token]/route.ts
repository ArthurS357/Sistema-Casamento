import { prisma } from "@/lib/db";
import { RsvpPublicSchema } from "@/lib/validation/schemas";
import { publicLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { canAccessPremiumFeatures } from "@/lib/permissions";

type Params = { params: Promise<{ token: string }> };

const select = {
  name: true,
  rsvpStatus: true,
  companions: true,
  dietaryRestrictions: true,
  wedding: {
    select: {
      title: true,
      date: true,
      workspace: { select: { plan: true } },
    },
  },
} as const;

type GuestRow = NonNullable<
  Awaited<ReturnType<typeof prisma.guest.findUnique<{ where: { rsvpToken: string }; select: typeof select }>>>
>;

// Resposta pública: nunca vaza o plano do workspace — só o boolean
// checkInAvailable (QR Code de check-in é feature Pro/Gestor).
function toPublic(guest: GuestRow) {
  const { workspace, ...wedding } = guest.wedding;
  return {
    ...guest,
    wedding,
    checkInAvailable: canAccessPremiumFeatures(workspace.plan),
  };
}

export async function GET(req: Request, { params }: Params) {
  const limited = await enforceRateLimit(req, publicLimiter, "rsvp");
  if (limited) return limited;
  const { token } = await params;
  const guest = await prisma.guest.findUnique({ where: { rsvpToken: token }, select });
  if (!guest) return Response.json({ error: "NotFound" }, { status: 404 });
  return Response.json(toPublic(guest));
}

export async function PATCH(req: Request, { params }: Params) {
  const limited = await enforceRateLimit(req, publicLimiter, "rsvp");
  if (limited) return limited;
  const { token } = await params;
  const exists = await prisma.guest.findUnique({
    where: { rsvpToken: token },
    select: { id: true },
  });
  if (!exists) return Response.json({ error: "NotFound" }, { status: 404 });
  const parsed = RsvpPublicSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "ValidationError" }, { status: 400 });
  const guest = await prisma.guest.update({
    where: { rsvpToken: token },
    data: parsed.data,
    select,
  });
  return Response.json(toPublic(guest));
}
