"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Users, Armchair, BarChart3, CalendarDays, Gift, ListChecks, Heart, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { pendingCount } from "@/lib/tasks";

interface WeddingDetail {
  id: string;
  title: string;
  date: string;
  budgetTotal: number;
  partner1Name: string | null;
  partner2Name: string | null;
  _count: { guests: number; expenses: number; tables: number; gifts: number; tasks: number };
}

export default function WeddingHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useQuery<WeddingDetail>({
    queryKey: ["wedding", id],
    queryFn: () => apiFetch(`/api/weddings/${id}`),
  });
  const { data: tasks } = useQuery<{ status: string }[]>({
    queryKey: ["tasks", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/tasks`),
  });

  if (!data) return <p className="text-slate-500">Carregando…</p>;

  const pending = tasks ? pendingCount(tasks) : null;
  const tiles: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: string; value: string }[] = [
    { href: `/weddings/${id}/tasks`, label: "Tarefas Pendentes", icon: ListChecks, tone: "text-gold-500", value: pending === null ? "…" : String(pending) },
    { href: `/weddings/${id}/budget`, label: "Orçamento", icon: Wallet, tone: "text-money-600", value: formatBRL(data.budgetTotal) },
    { href: `/weddings/${id}/guests`, label: "Convidados", icon: Users, tone: "text-gold-500", value: String(data._count.guests) },
    { href: `/weddings/${id}/tables`, label: "Mesas", icon: Armchair, tone: "text-slate-700", value: String(data._count.tables) },
    { href: `/weddings/${id}/gifts`, label: "Presentes", icon: Gift, tone: "text-gold-500", value: String(data._count.gifts) },
    { href: `/weddings/${id}/reports`, label: "Despesas", icon: BarChart3, tone: "text-slate-700", value: String(data._count.expenses) },
  ];

  const coupleNames = [data.partner1Name, data.partner2Name].filter(Boolean).join(" & ");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-4xl text-slate-900">{data.title}</h1>
        {coupleNames && (
          <p className="flex items-center gap-2 text-slate-600 mt-1">
            <Heart className="h-4 w-4 text-gold-400" /> {coupleNames}
          </p>
        )}
        <p className="flex items-center gap-2 text-slate-500 mt-2">
          <CalendarDays className="h-4 w-4" />
          {new Date(data.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent>
                  <div className={`mb-2 ${t.tone}`}><Icon className="h-6 w-6" /></div>
                  <p className="text-sm text-slate-500">{t.label}</p>
                  <p className="text-2xl font-semibold mt-1">{t.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <CoupleNamesCard
        weddingId={id}
        partner1Name={data.partner1Name}
        partner2Name={data.partner2Name}
      />
    </div>
  );
}

/** Configuração dos nomes do casal. Persiste via PATCH /api/weddings/[id]. */
function CoupleNamesCard({
  weddingId,
  partner1Name,
  partner2Name,
}: {
  weddingId: string;
  partner1Name: string | null;
  partner2Name: string | null;
}) {
  const qc = useQueryClient();
  const [p1, setP1] = useState(partner1Name ?? "");
  const [p2, setP2] = useState(partner2Name ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setP1(partner1Name ?? "");
    setP2(partner2Name ?? "");
  }, [partner1Name, partner2Name]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          partner1Name: p1.trim() || undefined,
          partner2Name: p2.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding", weddingId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="h-4 w-4 text-gold-500" />
          <h2 className="font-medium text-slate-900">Nomes do casal</h2>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Aparecem no painel e ajudam a identificar o casamento.
        </p>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <div className="flex-1">
            <Label htmlFor="cp1">Noivo(a) 1</Label>
            <Input id="cp1" value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Ex.: Ana" />
          </div>
          <div className="flex-1">
            <Label htmlFor="cp2">Noivo(a) 2</Label>
            <Input id="cp2" value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Ex.: Bruno" />
          </div>
          <Button type="submit" variant="gold" disabled={save.isPending} className="sm:w-auto">
            {saved ? <Check className="h-4 w-4" /> : null}
            {save.isPending ? "Salvando…" : saved ? "Salvo!" : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
