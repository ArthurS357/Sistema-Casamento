"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, Wallet, Crown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatBRL, toCents } from "@/lib/money";
import { canManageMultipleWeddings, requiresUpgradeBanner } from "@/lib/permissions";

interface Wedding {
  id: string;
  title: string;
  date: string;
  budgetTotal: number;
}

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data: workspace, isLoading: loadingWs } = useQuery<Workspace>({
    queryKey: ["workspace"],
    queryFn: () => apiFetch("/api/workspaces/active"),
  });
  
  const { data: weddings, isLoading: loadingWeddings } = useQuery<Wedding[]>({
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

  const isLoading = loadingWs || loadingWeddings;
  const plan = workspace?.plan || "free";
  const canCreate = canManageMultipleWeddings(plan) || (weddings && weddings.length === 0);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="space-y-3 pt-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {requiresUpgradeBanner(plan) && (
        <Card className="border-gold-300 bg-gold-50 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-200/50 text-gold-700">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg text-slate-900">Upgrade para o Pro</h3>
                <p className="text-sm text-slate-600">Desbloqueie acesso total a convidados, RSVP e controle completo do grande dia.</p>
              </div>
            </div>
            <Link href="/#planos" className="w-full sm:w-auto shrink-0">
              <Button variant="gold" className="w-full">Fazer Upgrade</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <header className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "100ms" }}>
        <h1 className="font-display text-3xl text-slate-900">
          {canManageMultipleWeddings(plan) ? "Meus Clientes / Casamentos" : "Seu Casamento"}
        </h1>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gold"><Plus className="h-4 w-4 mr-2" /> Novo</Button>
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
        )}
      </header>

      {weddings && weddings.length === 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "200ms" }}>
          <CardContent className="text-center py-12 text-slate-500">
            Nenhum casamento ainda. Clique em <strong>Novo</strong> para começar.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weddings?.map((w, i) => (
          <Link key={w.id} href={`/weddings/${w.id}`}>
            <Card 
              className="hover:shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-gold-300 hover:-translate-y-0.5 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both"
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <CardContent className="space-y-3 pt-6">
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
