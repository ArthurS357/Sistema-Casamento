import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-gold-50">
      <div className="text-center max-w-xl px-6">
        <h1 className="font-display text-5xl text-slate-900 mb-4">Wedding Planner</h1>
        <p className="text-slate-600 mb-8">Orçamento, convidados e logística do seu casamento em um só lugar.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login"><Button variant="gold" size="lg">Entrar</Button></Link>
          <Link href="/register"><Button variant="outline" size="lg">Criar conta</Button></Link>
        </div>
      </div>
    </main>
  );
}
