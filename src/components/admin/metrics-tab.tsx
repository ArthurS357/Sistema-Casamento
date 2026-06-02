"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, Heart, CheckCircle2, CalendarClock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/plans";

interface Metrics {
  totalUsers: number;
  weddings: { created: number; completed: number; upcoming: number };
  usersByPlan: Record<Plan, number>;
}

const planMeta: Record<Plan, { label: string; badge: string }> = {
  free: { label: "Free", badge: "bg-slate-100 text-slate-700" },
  pro: { label: "Pro", badge: "bg-gold-100 text-gold-700" },
  gestor: { label: "Gestor", badge: "bg-money-100 text-money-700" },
};

export function MetricsTab() {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ["admin", "metrics"],
    queryFn: () => apiFetch("/api/admin/metrics"),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Usuários cadastrados"
          value={data.totalUsers}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Casamentos criados"
          value={data.weddings.created}
          color="text-rose-600"
          bg="bg-rose-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Casamentos concluídos"
          value={data.weddings.completed}
          color="text-money-600"
          bg="bg-money-50"
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Casamentos futuros"
          value={data.weddings.upcoming}
          color="text-gold-600"
          bg="bg-gold-50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários por plano</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(planMeta) as Plan[]).map((plan) => (
            <div
              key={plan}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  planMeta[plan].badge,
                )}
              >
                {planMeta[plan].label}
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {data.usersByPlan[plan] ?? 0}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            bg,
            color,
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
