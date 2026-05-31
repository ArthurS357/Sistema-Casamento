import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { RegisterSchema } from "@/lib/validation/schemas";
import { errorResponse } from "@/lib/auth/guards";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "workspace"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return Response.json({ error: "EmailTaken" }, { status: 409 });
    const password = await hashPassword(data.password);
    // Provisiona usuário + workspace pessoal (tenant) + membership owner
    // numa transação: ninguém fica sem tenant.
    const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 8)}`;
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { name: data.name, email: data.email, password },
        select: { id: true, email: true, name: true },
      });
      const ws = await tx.workspace.create({
        data: { name: `${data.name}`, slug },
      });
      await tx.membership.create({
        data: { userId: u.id, workspaceId: ws.id, role: "owner" },
      });
      return u;
    });
    return Response.json(user, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
