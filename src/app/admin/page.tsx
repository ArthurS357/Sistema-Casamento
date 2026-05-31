import { Users, Building2, Heart, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const planLabel: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  gestor: "Gestor",
};

const planColor: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  pro: "bg-gold-100 text-gold-700",
  gestor: "bg-money-100 text-money-700",
};

export default async function AdminPage() {
  const [userCount, weddingCount, workspacesByPlan, recentWorkspaces] =
    await Promise.all([
      prisma.user.count(),
      prisma.wedding.count(),
      prisma.workspace.groupBy({ by: ["plan"], _count: { _all: true } }),
      prisma.workspace.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
          _count: { select: { weddings: true, memberships: true } },
        },
      }),
    ]);

  const totalWorkspaces = workspacesByPlan.reduce((s, r) => s + r._count._all, 0);
  const byPlan = Object.fromEntries(workspacesByPlan.map((r) => [r.plan, r._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-slate-900">Visão Geral</h1>
        <p className="mt-1 text-sm text-slate-500">
          Métricas globais do sistema em tempo real.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Usuários cadastrados"
          value={userCount}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Workspaces totais"
          value={totalWorkspaces}
          color="text-gold-600"
          bg="bg-gold-50"
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Casamentos criados"
          value={weddingCount}
          color="text-rose-600"
          bg="bg-rose-50"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Workspaces pagos"
          value={(byPlan["pro"] ?? 0) + (byPlan["gestor"] ?? 0)}
          color="text-money-600"
          bg="bg-money-50"
        />
      </div>

      {/* ── Workspaces por plano ────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(["free", "pro", "gestor"] as const).map((plan) => (
          <Card key={plan}>
            <CardContent className="flex items-center justify-between pt-5">
              <span className="text-sm font-medium text-slate-600">
                {planLabel[plan]}
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {byPlan[plan] ?? 0}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Workspaces recentes ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Workspaces recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {recentWorkspaces.map((ws) => (
              <div key={ws.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ws.name}</p>
                  <p className="text-xs text-slate-400">
                    {ws._count.memberships} membro(s) · {ws._count.weddings} casamento(s)
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    planColor[ws.plan] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {planLabel[ws.plan] ?? ws.plan}
                </span>
              </div>
            ))}
            {recentWorkspaces.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Nenhum workspace ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon, label, value, color, bg,
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
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", bg, color)}>
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
