"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Info, AlertTriangle, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AnnouncementType } from "@/lib/validation/enums";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  createdAt: string;
}

export function AnnouncementsTab() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("INFO");
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading } = useQuery<{ announcements: Announcement[] }>({
    queryKey: ["admin", "announcements"],
    queryFn: () => apiFetch("/api/admin/announcements"),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
    qc.invalidateQueries({ queryKey: ["announcements", "active"] });
  };

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Announcement>("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, message, type, isActive }),
      }),
    onSuccess: () => {
      invalidate();
      setTitle("");
      setMessage("");
      setType("INFO");
      setIsActive(true);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      apiFetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      }),
    onSuccess: invalidate,
  });

  const announcements = data?.announcements ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ── Formulário ──────────────────────────────────────────── */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center gap-2">
          <Megaphone className="h-4 w-4 text-slate-400" />
          <CardTitle className="text-base">Novo anúncio</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim() && message.trim()) create.mutate();
            }}
          >
            <div>
              <Label htmlFor="ann-title">Título</Label>
              <Input
                id="ann-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Manutenção programada"
              />
            </div>
            <div>
              <Label htmlFor="ann-message">Mensagem</Label>
              <Textarea
                id="ann-message"
                required
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="O sistema ficará indisponível..."
              />
            </div>
            <div>
              <Label htmlFor="ann-type">Tipo</Label>
              <Select
                id="ann-type"
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
              >
                <option value="INFO">Informação</option>
                <option value="WARNING">Aviso</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500"
              />
              Ativar imediatamente
            </label>
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={create.isPending}
            >
              <Plus className="h-4 w-4" />
              {create.isPending ? "Criando…" : "Criar anúncio"}
            </Button>
            {create.isError && (
              <p className="text-sm text-red-500">
                {(create.error as Error).message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ── Lista ───────────────────────────────────────────────── */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Anúncios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              Nenhum anúncio criado.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-4">
                  <div
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      a.type === "WARNING"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600",
                    )}
                  >
                    {a.type === "WARNING" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </p>
                    <p className="text-sm text-slate-500">{a.message}</p>
                  </div>
                  <ToggleSwitch
                    checked={a.isActive}
                    disabled={toggle.isPending}
                    onChange={(next) => toggle.mutate({ id: a.id, next })}
                    label={`Ativar anúncio ${a.title}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-50",
        checked ? "bg-money-500" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
