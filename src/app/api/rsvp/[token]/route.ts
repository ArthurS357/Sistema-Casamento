import { prisma } from "@/lib/db";
import { RsvpPublicSchema } from "@/lib/validation/schemas";

type Params = { params: Promise<{ token: string }> };

const select = {
  name: true,
  rsvpStatus: true,
  dietaryRestrictions: true,
  wedding: { select: { title: true, date: true } },
} as const;

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const guest = await prisma.guest.findUnique({ where: { rsvpToken: token }, select });
  if (!guest) return Response.json({ error: "NotFound" }, { status: 404 });
  return Response.json(guest);
}

export async function PATCH(req: Request, { params }: Params) {
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
  return Response.json(guest);
}
