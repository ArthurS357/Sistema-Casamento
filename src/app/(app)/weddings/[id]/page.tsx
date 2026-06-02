"use client";
import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Users, Armchair, BarChart3, CalendarDays, Gift } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";

interface WeddingDetail {
  id: string;
  title: string;
  date: string;
  budgetTotal: number;
  _count: { guests: number; expenses: number; tables: number; gifts: number };
}

export default function WeddingHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useQuery<WeddingDetail>({
    queryKey: ["wedding", id],
    queryFn: () => apiFetch(`/api/weddings/${id}`),
  });

  if (!data) return <p className="text-slate-500">Carregando…</p>;

  const tiles: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: string; value: string }[] = [
    { href: `/weddings/${id}/budget`, label: "Orçamento", icon: Wallet, tone: "text-money-600", value: formatBRL(data.budgetTotal) },
    { href: `/weddings/${id}/guests`, label: "Convidados", icon: Users, tone: "text-gold-500", value: String(data._count.guests) },
    { href: `/weddings/${id}/tables`, label: "Mesas", icon: Armchair, tone: "text-slate-700", value: String(data._count.tables) },
    { href: `/weddings/${id}/gifts`, label: "Presentes", icon: Gift, tone: "text-gold-500", value: String(data._count.gifts) },
    { href: `/weddings/${id}/reports`, label: "Despesas", icon: BarChart3, tone: "text-slate-700", value: String(data._count.expenses) },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-4xl text-slate-900">{data.title}</h1>
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
    </div>
  );
}
