"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, Wallet, Crown, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { NameInput } from "@/components/ui/name-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/money";
import { canManageMultipleWeddings, requiresUpgradeBanner, canCreateWedding } from "@/lib/permissions";
import { WorkspaceMembers } from "@/components/dashboard/workspace-members";

interface Wedding {
  id: string;
  title: string;
  date: string;
  budgetTotal: number;
  partner1Name: string | null;
  partner2Name: string | null;
}

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [partner1, setPartner1] = useState("");
  const [partner2, setPartner2] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Wedding>("/api/weddings", {
        method: "POST",
        body: JSON.stringify({
          title,
          date: date ? date.toISOString() : new Date().toISOString(),
          budgetTotal: budget || 0,
          partner1Name: partner1.trim() || undefined,
          partner2Name: partner2.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weddings"] });
      setOpen(false);
      setTitle(""); setDate(undefined); setBudget(undefined); setPartner1(""); setPartner2("");
    },
  });

  const isLoading = loadingWs || loadingWeddings;
  const plan = workspace?.plan || "free";
  const canCreate = !!weddings && canCreateWedding(plan, weddings.length);
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 px-1">
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-1">

      {/* ── Upgrade Banner ── */}
      {requiresUpgradeBanner(plan) && (
        <Card className="rounded-3xl border-gold-300 bg-gold-50/60 backdrop-blur-md shadow-lg shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-200/50 text-gold-700">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg text-slate-900">Upgrade para o Pro</h3>
                <p className="text-sm text-slate-500">Desbloqueie acesso total a convidados, RSVP e controle completo do grande dia.</p>
              </div>
            </div>
            <Link href="/settings" className="w-full sm:w-auto shrink-0">
              <Button variant="gold" className="w-full">Fazer Upgrade</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ── Personalized Header ── */}
      <header className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "80ms" }}>
        <h1 className="font-display text-3xl sm:text-4xl text-slate-900 leading-tight">
          {firstName ? (
            <>Bem-vindo(a), {firstName} <Sparkles className="inline-block h-7 w-7 text-gold-400 mb-1" /></>
          ) : (
            <>Bem-vindo(a) <Sparkles className="inline-block h-7 w-7 text-gold-400 mb-1" /></>
          )}
        </h1>
        <p className="mt-1.5 text-base text-slate-400">
          {canManageMultipleWeddings(plan)
            ? "Gerencie seus clientes e casamentos em um só lugar."
            : "Aqui está o resumo do seu casamento e atividades."}
        </p>
      </header>

      {/* ── Section heading ── */}
      <div
        className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both"
        style={{ animationDelay: "160ms" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          {canManageMultipleWeddings(plan) ? "Clientes / Casamentos" : "Seu Casamento"}
        </h2>
      </div>

      {/* ── Wedding Grid ── */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {weddings?.map((w, i) => (
          <Link key={w.id} href={`/weddings/${w.id}`}>
            <Card
              className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5 hover:bg-white/75 hover:shadow-xl hover:shadow-black/8 hover:-translate-y-1 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-4 ease-out fill-mode-both"
              style={{ animationDelay: `${200 + i * 80}ms`, animationDuration: "500ms" }}
            >
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-xl text-slate-800 leading-snug">{w.title}</h2>
                {(w.partner1Name || w.partner2Name) && (
                  <p className="text-sm font-medium text-slate-500">
                    {[w.partner1Name, w.partner2Name].filter(Boolean).join(" & ")}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="h-4 w-4 text-slate-300" />
                  {new Date(w.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-money-600">
                  <Wallet className="h-4 w-4" />
                  {formatBRL(w.budgetTotal)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* ── Add Wedding card ── */}
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/30 backdrop-blur-sm hover:bg-white/50 hover:border-gold-300 hover:-translate-y-1 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both min-h-[140px] flex flex-col items-center justify-center gap-2 p-6 text-slate-400 hover:text-gold-500 group"
                style={{ animationDelay: `${200 + (weddings?.length ?? 0) * 80}ms` }}
                aria-label="Adicionar novo casamento"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-gold-300 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Novo Casamento</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo casamento</DialogTitle></DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
              >
                <div><Label htmlFor="t">Título</Label><Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="p1">Noivo(a) 1</Label><NameInput id="p1" value={partner1} onValueChange={setPartner1} placeholder="Ex.: Ana" /></div>
                  <div><Label htmlFor="p2">Noivo(a) 2</Label><NameInput id="p2" value={partner2} onValueChange={setPartner2} placeholder="Ex.: Bruno" /></div>
                </div>
                <div><Label>Data</Label><DatePicker value={date} onChange={setDate} /></div>
                <div><Label htmlFor="b">Orçamento</Label><CurrencyInput id="b" value={budget} onChange={setBudget} placeholder="R$ 0,00" /></div>
                <Button variant="gold" type="submit" disabled={create.isPending} className="w-full">
                  {create.isPending ? "Criando…" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Empty state ── */}
        {weddings && weddings.length === 0 && !canCreate && (
          <div className="col-span-full rounded-3xl bg-white/40 backdrop-blur-md border border-white/40 py-14 text-center text-slate-400 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both" style={{ animationDelay: "200ms" }}>
            Nenhum casamento ainda.{" "}
            <Link href="/settings" className="text-gold-500 hover:underline font-medium">
              Faça upgrade
            </Link>{" "}
            para começar.
          </div>
        )}
      </div>

      {/* ── Workspace Members ── */}
      <WorkspaceMembers plan={plan} />
    </div>
  );
}
