import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/** Fallback de transição das rotas autenticadas — espelha o skeleton do dashboard. */
export default function Loading() {
  return (
    <div role="status" aria-label="Carregando página" className="max-w-6xl mx-auto space-y-8 px-1">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 mb-1" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-3xl">
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
