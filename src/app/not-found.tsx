import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="font-display text-6xl text-gold-400">404</p>
      <h1 className="font-display text-2xl text-slate-900">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">
        O endereço que você procura não existe ou foi movido.
      </p>
      <Link href="/dashboard">
        <Button variant="gold">Ir para o painel</Button>
      </Link>
    </div>
  );
}
