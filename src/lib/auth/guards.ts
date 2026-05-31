import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new AuthError(401, "Unauthorized");
  return id;
}

export async function assertWeddingAccess(
  weddingId: string,
  userId: string,
): Promise<void> {
  const w = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: { userId: true },
  });
  if (!w) throw new AuthError(404, "Wedding not found");
  if (w.userId !== userId) throw new AuthError(403, "Forbidden");
}

export async function requireWeddingAccess(weddingId: string): Promise<string> {
  const userId = await requireUserId();
  await assertWeddingAccess(weddingId, userId);
  return userId;
}

export function errorResponse(e: unknown): Response {
  if (e instanceof AuthError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && e.name === "ZodError")
    return Response.json({ error: "ValidationError", issues: JSON.parse(e.message) }, { status: 400 });
  console.error(e);
  return Response.json({ error: "InternalError" }, { status: 500 });
}
