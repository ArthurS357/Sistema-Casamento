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
  const w = await prisma.wedding.findUnique({ where: { id }, select: { userId: true } });
  if (!w || w.userId !== session.user.id) redirect("/dashboard");
  return <>{children}</>;
}
