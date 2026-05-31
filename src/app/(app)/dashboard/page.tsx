"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, Wallet, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatBRL, toCents } from "@/lib/money";

interface Wedding {
  id: string;
  title: string;
  date: string;
  budgetTotal: number;
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Wedding[]>({
    queryKey: ["weddings"],
    queryFn: () => apiFetch("/api/weddings"),
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Wedding>("/api/weddings", {
        method: "POST",
        body: JSON.stringify({
          title,
          date: new Date(date).toISOString(),
          budgetTotal: budget ? toCents(Number(budget)) : 0,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weddings"] });
      setOpen(false);
      setTitle(""); setDate(""); setBudget("");
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900">Seus casamentos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gold"><Plus className="h-4 w-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo casamento</DialogTitle></DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
            >
              <div><Label htmlFor="t">Título</Label><Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label htmlFor="d">Data</Label><Input id="d" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label htmlFor="b">Orçamento (R$)</Label><Input id="b" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
              <Button variant="gold" type="submit" disabled={create.isPending} className="w-full">
                {create.isPending ? "Criando…" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent></Card>
          ))}
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <Card><CardContent className="text-center py-12 text-slate-500">
          Nenhum casamento ainda. Clique em <strong>Novo</strong> para começar.
        </CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((w) => (
          <Link key={w.id} href={`/weddings/${w.id}`}>
            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer animate-fade-up">
              <CardContent className="space-y-3">
                <h2 className="font-display text-xl text-slate-900">{w.title}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(w.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2 text-sm text-money-600">
                  <Wallet className="h-4 w-4" /> {formatBRL(w.budgetTotal)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
