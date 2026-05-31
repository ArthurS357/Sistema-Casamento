import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const w = await prisma.wedding.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!w) redirect("/dashboard");
  const member = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId: w.workspaceId },
    },
    select: { id: true },
  });
  if (!member) redirect("/dashboard");
  return <>{children}</>;
}
