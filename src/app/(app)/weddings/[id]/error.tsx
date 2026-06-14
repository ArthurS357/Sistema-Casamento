"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WeddingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-xl text-slate-900">Algo deu errado neste casamento</h2>
            <p className="text-sm text-slate-500">
              {error.message || "Ocorreu um erro inesperado ao carregar os dados. Tente novamente."}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400">Código: {error.digest}</p>
            )}
          </div>
          <Button variant="gold" onClick={reset}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
