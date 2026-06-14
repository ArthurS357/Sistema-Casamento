"use client";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function WeddingNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <FileQuestion className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-xl text-slate-900">Página não encontrada</h2>
            <p className="text-sm text-slate-500">
              O recurso ou casamento que você está procurando não existe ou você não tem acesso.
            </p>
          </div>
          <Link href="/dashboard" className={buttonVariants({ variant: "gold" })}>
            Voltar ao Painel
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
