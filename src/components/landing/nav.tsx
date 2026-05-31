import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { href: "/#dores", label: "Desafios" },
  { href: "/#solucao", label: "Solução" },
  { href: "/#planos", label: "Planos" },
];

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-slate-200/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-slate-900">
            <Heart className="h-4 w-4" aria-hidden />
          </span>
          Atelier
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="transition-colors hover:text-slate-900">
              {s.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button variant="gold" size="sm">Criar conta</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
