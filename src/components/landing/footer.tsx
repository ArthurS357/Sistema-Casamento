import Link from "next/link";
import { Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-lg text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-slate-900">
              <Heart className="h-4 w-4" aria-hidden />
            </span>
            Atelier
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Planejamento de casamentos, do primeiro convidado ao último brinde.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
          <Link href="/#faq" className="transition-colors hover:text-slate-900">
            Dúvidas
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-slate-900">
            Política de Privacidade
          </Link>
          <Link href="/terms" className="transition-colors hover:text-slate-900">
            Termos de Uso
          </Link>
          <Link href="/login" className="transition-colors hover:text-slate-900">
            Entrar
          </Link>
        </nav>
      </div>

      <div className="border-t border-slate-100 py-5">
        <p className="mx-auto max-w-6xl px-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Atelier. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
