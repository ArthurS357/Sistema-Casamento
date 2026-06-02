"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Search,
  KeyRound,
  Ban,
  CheckCircle2,
  UserX,
  ShieldCheck,
  ArrowLeftRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLANS, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { AdminUserAction } from "@/lib/validation/schemas";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  systemRole: string;
  isBlocked: boolean;
  createdAt: string;
  plan: string;
  workspaceId: string | null;
}

const planBadge: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  pro: "bg-gold-100 text-gold-700",
  gestor: "bg-money-100 text-money-700",
};

type Modal =
  | { type: "plan"; user: UserRow }
  | { type: "reset"; user: UserRow }
  | { type: "anon"; user: UserRow }
  | null;

export function UsersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [planChoice, setPlanChoice] = useState<Plan>("free");

  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (planFilter) params.set("plan", planFilter);
  const queryString = params.toString();

  const { data, isLoading } = useQuery<{ users: UserRow[] }>({
    queryKey: ["admin", "users", q.trim(), planFilter],
    queryFn: () =>
      apiFetch(`/api/admin/users${queryString ? `?${queryString}` : ""}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
    qc.invalidateQueries({ queryKey: ["admin", "logs"] });
  };

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminUserAction }) =>
      apiFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const anonymize = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate();
      setModal(null);
    },
  });

  const users = data?.users ?? [];
  const busy = patch.isPending || anonymize.isPending;

  return (
    <div className="space-y-4">
      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="sm:w-48"
          aria-label="Filtrar por plano"
        >
          <option value="">Todos os planos</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Plano</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4" colSpan={4}>
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-slate-400"
                    colSpan={4}
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {u.name || "—"}
                        </p>
                        {u.systemRole === "admin" && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600"
                            title="Administrador do sistema"
                          >
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          planBadge[u.plan] ?? "bg-slate-100 text-slate-700",
                        )}
                      >
                        {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                          <Ban className="h-3.5 w-3.5" /> Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-money-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            aria-label={`Ações para ${u.email}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Gerenciar usuário</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => {
                              setPlanChoice(
                                (PLANS as readonly string[]).includes(u.plan)
                                  ? (u.plan as Plan)
                                  : "free",
                              );
                              setModal({ type: "plan", user: u });
                            }}
                          >
                            <ArrowLeftRight className="h-4 w-4" /> Alterar plano
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setModal({ type: "reset", user: u })}
                          >
                            <KeyRound className="h-4 w-4" /> Resetar senha
                          </DropdownMenuItem>
                          {u.systemRole !== "admin" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                patch.mutate({
                                  id: u.id,
                                  body: {
                                    action: "setBlocked",
                                    isBlocked: !u.isBlocked,
                                  },
                                })
                              }
                            >
                              {u.isBlocked ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" /> Reativar
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4" /> Bloquear
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {u.systemRole !== "admin" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="danger"
                                onSelect={() =>
                                  setModal({ type: "anon", user: u })
                                }
                              >
                                <UserX className="h-4 w-4" /> Anonimizar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal: alterar plano ────────────────────────────────── */}
      <Dialog
        open={modal?.type === "plan"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar plano</DialogTitle>
            <DialogDescription>
              {modal?.type === "plan" && modal.user.email}
            </DialogDescription>
          </DialogHeader>
          <Select
            value={planChoice}
            onChange={(e) => setPlanChoice(e.target.value as Plan)}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </Select>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="gold"
              disabled={busy}
              onClick={() =>
                modal?.type === "plan" &&
                patch.mutate({
                  id: modal.user.id,
                  body: { action: "setPlan", plan: planChoice },
                })
              }
            >
              {patch.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: resetar senha ────────────────────────────────── */}
      <Dialog
        open={modal?.type === "reset"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>
              A senha de {modal?.type === "reset" && modal.user.email} será
              redefinida para{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                Mudar@123
              </code>
              . Oriente o usuário a trocá-la no próximo acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                modal?.type === "reset" &&
                patch.mutate({
                  id: modal.user.id,
                  body: { action: "resetPassword" },
                })
              }
            >
              {patch.isPending ? "Redefinindo…" : "Confirmar reset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: anonimizar ───────────────────────────────────── */}
      <Dialog
        open={modal?.type === "anon"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonimizar usuário</DialogTitle>
            <DialogDescription>
              O registro de {modal?.type === "anon" && modal.user.email} não
              será apagado (preserva os dados de casamentos), mas o nome, e-mail
              e senha serão removidos e o acesso bloqueado.{" "}
              <strong className="text-red-600">Esta ação é irreversível.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                modal?.type === "anon" && anonymize.mutate(modal.user.id)
              }
            >
              {anonymize.isPending ? "Anonimizando…" : "Anonimizar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(patch.isError || anonymize.isError) && (
        <p className="text-sm text-red-500">
          {((patch.error ?? anonymize.error) as Error)?.message}
        </p>
      )}
    </div>
  );
}
