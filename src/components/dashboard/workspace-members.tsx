"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Crown, Trash2, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { canAddWorkspaceMember } from "@/lib/permissions";

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface MembersResponse {
  members: Member[];
  plan: string;
  limit: number;
}

export function WorkspaceMembers({ plan }: { plan: string }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery<MembersResponse>({
    queryKey: ["workspace-members"],
    queryFn: () => apiFetch("/api/workspaces/members"),
  });

  const add = useMutation({
    mutationFn: (value: string) =>
      apiFetch<Member>("/api/workspaces/members", {
        method: "POST",
        body: JSON.stringify({ email: value }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-members"] });
      setEmail("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/workspaces/members?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-members"] }),
  });

  const activePlan = data?.plan ?? plan;
  const members = data?.members ?? [];
  const canAdd = canAddWorkspaceMember(activePlan, members.length);

  return (
    <Card className="bg-white/40 backdrop-blur-md border-white/40 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
      <CardHeader className="flex flex-row items-center gap-2">
        <Users className="h-5 w-5 text-slate-500" />
        <CardTitle>Membros do Casamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Convide seu parceiro(a) para gerenciar o casamento junto com você.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {m.user.name || m.user.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.user.email}</p>
                </div>
                {m.role === "owner" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
                    <Crown className="h-3 w-3" /> Dono
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove.mutate(m.id)}
                    disabled={remove.isPending}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                    aria-label={`Remover ${m.user.email}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!isLoading && canAdd && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) add.mutate(email.trim());
            }}
          >
            <Label htmlFor="member-email">E-mail do parceiro(a)</Label>
            <div className="flex gap-2">
              <Input
                id="member-email"
                type="email"
                required
                placeholder="parceiro@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button variant="gold" type="submit" disabled={add.isPending} className="shrink-0">
                <UserPlus className="h-4 w-4" /> {add.isPending ? "Adicionando…" : "Adicionar"}
              </Button>
            </div>
            {add.isError && (
              <p className="text-sm text-red-600">{(add.error as Error).message}</p>
            )}
          </form>
        )}

        {!isLoading && !canAdd && activePlan === "free" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-md border border-gold-300 bg-gold-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-200/50 text-gold-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Convide alguém para o seu time</p>
                <p className="text-sm text-slate-600">
                  No plano Pro você adiciona seu parceiro(a) para planejar a dois.
                </p>
              </div>
            </div>
            <Link href="/#planos" className="w-full sm:w-auto shrink-0">
              <Button variant="gold" className="w-full">Fazer Upgrade</Button>
            </Link>
          </div>
        )}

        {!isLoading && !canAdd && activePlan !== "free" && (
          <p className="text-sm text-slate-500">
            Você atingiu o limite de membros do seu plano.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
