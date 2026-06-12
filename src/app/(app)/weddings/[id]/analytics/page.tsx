"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Users, Wallet, Store, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Paywall } from "@/components/paywall";
import { useActivePlan } from "@/lib/use-plan";
import { canAccessManagerAnalytics } from "@/lib/permissions";
import { apiFetch } from "@/lib/api";
import { formatBRL } from "@/lib/money";
import type { AnalyticsPayload } from "@/types/api";

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { plan, isLoading } = useActivePlan();
  const hasAccess = plan !== undefined && canAccessManagerAnalytics(plan);

  const { data, isLoading: isLoadingAnalytics, error } = useQuery<AnalyticsPayload>({
    queryKey: ["analytics", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/analytics`),
    enabled: hasAccess,
  });

  if (isLoading || plan === undefined || (hasAccess && isLoadingAnalytics)) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Paywall
        tier="gestor"
        title="Dashboard Analítico"
        description="Exclusivo do plano Gestor: acompanhe engajamento dos convidados, projeção de custos e o status de cada fornecedor em um só lugar."
        benefits={[
          "Engajamento de convidados por semana",
          "Projeção de custos: previsto x realizado",
          "Relatório consolidado de fornecedores",
        ]}
      />
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <p className="text-slate-500">
          Não foi possível carregar as métricas. Tente novamente em instantes.
        </p>
      </div>
    );
  }

  const confirmedPct =
    data.rsvp.total > 0 ? Math.round((data.rsvp.confirmed / data.rsvp.total) * 100) : 0;
  const kpis = [
    {
      label: "Convidados confirmados",
      value: `${confirmedPct}%`,
      icon: Users,
      tone: "text-gold-500",
    },
    {
      label: "Custo previsto",
      value: formatBRL(data.finance.plannedCents),
      icon: Wallet,
      tone: "text-money-600",
    },
    {
      label: "Fornecedores ativos",
      value: String(data.vendors.length),
      icon: Store,
      tone: "text-slate-700",
    },
    {
      label: "Contas em atraso",
      value: formatBRL(data.finance.overdueCents),
      icon: AlertTriangle,
      tone: data.finance.overdueCents > 0 ? "text-red-500" : "text-money-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-gold-300">
          <Sparkles className="h-3.5 w-3.5" /> Gestor
        </span>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Dashboard Analítico</h1>
        <p className="text-slate-500 mt-1">Métricas avançadas do casamento.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent>
                <div className={`mb-2 ${k.tone}`}><Icon className="h-6 w-6" /></div>
                <p className="text-sm text-slate-500">{k.label}</p>
                <p className="text-2xl font-semibold mt-1">{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Engajamento de Convidados" subtitle="Confirmações de RSVP por semana">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.engagementTimeline} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="confirmados" stroke="#16a34a" fill="#bbf7d0" />
              <Area type="monotone" dataKey="pendentes" stroke="#d4a72c" fill="#fdeec2" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Projeção de Custos" subtitle="Previsto x realizado (acumulado, R$)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.costTimeline} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="previsto" stroke="#0f172a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="realizado" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Relatório de Fornecedores"
          subtitle="Lançamentos e pendências por categoria de despesa"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.vendors} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="fornecedor" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="contratos" fill="#d4a72c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendencias" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardContent>
        <h2 className="font-medium text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mb-4">{subtitle}</p>
        {children}
      </CardContent>
    </Card>
  );
}
