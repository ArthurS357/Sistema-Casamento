import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const w = await prisma.wedding.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!w) redirect("/dashboard");
  const member = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId: w.workspaceId },
    },
    select: { id: true },
  });
  if (!member) redirect("/dashboard");
  return <>{children}</>;
}
