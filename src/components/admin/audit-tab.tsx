"use client";
import { useQuery } from "@tanstack/react-query";
import { Database, Activity, Server, History } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemLog {
  id: string;
  action: string;
  details: string | null;
  userId: string | null;
  createdAt: string;
}

// Dados de infraestrutura mockados — exigem integração nativa de
// infra (métricas do provedor) que ainda não existe.
const infraCards = [
  { icon: Database, label: "Uso de banco", value: "128 MB", hint: "de 1 GB", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Activity, label: "Requisições (24h)", value: "8.4k", hint: "+12% vs ontem", color: "text-money-600", bg: "bg-money-50" },
  { icon: Server, label: "Uptime", value: "99.98%", hint: "últimos 30 dias", color: "text-gold-600", bg: "bg-gold-50" },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditTab() {
  const { data, isLoading } = useQuery<{ logs: SystemLog[] }>({
    queryKey: ["admin", "logs"],
    queryFn: () => apiFetch("/api/admin/logs"),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-8">
      {/* ── Infra (mockado) ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {infraCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-start gap-4 pt-5">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.bg} ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{c.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">{c.value}</p>
                <p className="text-xs text-slate-400">{c.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Trilha de auditoria ─────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-base">Trilha de auditoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700">
                      {log.details ?? log.action}
                    </p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                      {log.action}
                    </span>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {formatDate(log.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
