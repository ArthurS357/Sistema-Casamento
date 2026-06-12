"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MailQuestion, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatBRL } from "@/lib/money";
import type { PortfolioPayload } from "@/types/api";

/**
 * Visão de carteira do plano Gestor: KPIs globais do workspace e lista
 * acionável dos próximos eventos (contas a vencer em 7 dias e RSVPs
 * pendentes), com atalho direto para cada casamento.
 */
export function ManagerDashboard() {
  const { data, isLoading, error } = useQuery<PortfolioPayload>({
    queryKey: ["portfolio"],
    queryFn: () => apiFetch("/api/workspaces/portfolio"),
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-slate-400">
        Não foi possível carregar a visão da carteira. Tente novamente em instantes.
      </p>
    );
  }

  const kpis = [
    {
      label: "Casamentos ativos",
      value: String(data.totals.activeWeddings),
      hint: "eventos futuros no workspace",
      icon: CalendarDays,
      tone: "text-gold-500",
    },
    {
      label: "A vencer em 7 dias",
      value: formatBRL(data.totals.dueSoonCents),
      hint:
        data.totals.dueSoonCount > 0
          ? `${data.totals.dueSoonCount} lançamento(s) em aberto`
          : "nenhuma conta na semana",
      icon: AlertTriangle,
      tone: data.totals.dueSoonCents > 0 ? "text-red-500" : "text-money-600",
    },
    {
      label: "RSVPs pendentes",
      value: String(data.totals.pendingRsvps),
      hint: "somando todos os clientes",
      icon: MailQuestion,
      tone: data.totals.pendingRsvps > 0 ? "text-gold-500" : "text-slate-400",
    },
  ];

  return (
    <section
      className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both"
      style={{ animationDelay: "120ms" }}
      aria-label="Visão geral da carteira"
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        Visão da Carteira
      </h2>

      {/* ── KPIs globais ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5"
            >
              <CardContent className="p-5">
                <div className={`mb-2 ${k.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-500">{k.label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-0.5">{k.value}</p>
                <p className="text-xs text-slate-400 mt-1">{k.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Próximos eventos com pendências ── */}
      {data.weddings.length > 0 && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg shadow-black/5">
          <CardContent className="p-2 sm:p-3">
            <ul className="divide-y divide-slate-100">
              {data.weddings.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/weddings/${w.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-3 hover:bg-white/70 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 truncate">{w.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(w.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {w.dueSoonCents > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {formatBRL(w.dueSoonCents)} a vencer
                      </span>
                    )}
                    {w.pendingRsvps > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-600">
                        <MailQuestion className="h-3 w-3" />
                        {w.pendingRsvps} RSVP{w.pendingRsvps > 1 ? "s" : ""} pendente
                        {w.pendingRsvps > 1 ? "s" : ""}
                      </span>
                    )}
                    {w.dueSoonCents === 0 && w.pendingRsvps === 0 && (
                      <span className="text-xs text-slate-300">sem pendências</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-gold-500 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
