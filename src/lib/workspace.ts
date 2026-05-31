import { prisma } from "@/lib/db";

export function slugify(s: string): string {
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

// Invariante do produto: todo User tem ao menos um Workspace. Idempotente:
// usado tanto no registro por credenciais quanto no createUser do OAuth.
export async function ensurePersonalWorkspace(
  userId: string,
  name?: string | null,
): Promise<void> {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existing) return;
  const base = name?.trim() || "Meu Workspace";
  const slug = `${slugify(base)}-${crypto.randomUUID().slice(0, 8)}`;
  await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: { name: base, slug } });
    await tx.membership.create({
      data: { userId, workspaceId: ws.id, role: "owner" },
    });
  });
}
