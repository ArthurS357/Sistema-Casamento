import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin — Sistema Casamento" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // DB lookup — não confia apenas no JWT para decisão de segurança crítica
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { systemRole: true },
  });

  if (user?.systemRole !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold-600" aria-hidden />
            <span className="font-semibold text-slate-900">Painel Admin</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Voltar ao app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
