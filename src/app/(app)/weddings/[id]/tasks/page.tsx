"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, ListChecks, CalendarClock, Tag } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/lib/validation/enums";
import { TASK_STATUS_ORDER, TASK_STATUS_META, dueStatus, type DueStatus } from "@/lib/tasks";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: (typeof TASK_STATUS_ORDER)[number];
  category: string | null;
}

const DUE_STYLE: Record<DueStatus, string> = {
  none: "text-slate-400",
  overdue: "text-red-600 font-medium",
  today: "text-amber-600 font-medium",
  soon: "text-amber-600",
  upcoming: "text-slate-500",
};

const DUE_LABEL: Record<DueStatus, string> = {
  none: "",
  overdue: "Atrasada",
  today: "Vence hoje",
  soon: "Em breve",
  upcoming: "",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const key = ["tasks", id];

  const { data: tasks } = useQuery<Task[]>({
    queryKey: key,
    queryFn: () => apiFetch(`/api/weddings/${id}/tasks`),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const save = useMutation({
    mutationFn: (body: object) =>
      editing
        ? apiFetch(`/api/weddings/${id}/tasks/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) })
        : apiFetch(`/api/weddings/${id}/tasks`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["wedding", id] });
      setOpen(false);
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (taskId: string) => apiFetch(`/api/weddings/${id}/tasks/${taskId}`, { method: "DELETE" }),
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) => (old ?? []).filter((t) => t.id !== taskId));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["wedding", id] });
    },
  });

  // Optimistic UI: alterna o status na hora; reverte se a API falhar.
  const setStatus = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Task["status"] }) =>
      apiFetch(`/api/weddings/${id}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ task, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) =>
        (old ?? []).map((t) => (t.id === task.id ? { ...t, status } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["wedding", id] });
    },
  });

  function toggleDone(task: Task) {
    setStatus.mutate({ task, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" });
  }

  function cycleStatus(task: Task) {
    const next = TASK_STATUS_ORDER[(TASK_STATUS_ORDER.indexOf(task.status) + 1) % TASK_STATUS_ORDER.length];
    if (next) setStatus.mutate({ task, status: next });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Checklist</h1>
          <p className="text-sm text-slate-500 mt-1">Organize as pendências do casamento por etapa.</p>
        </div>
        <Button variant="gold" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </header>

      {!tasks && (
        <div className="grid gap-4 md:grid-cols-3">
          {TASK_STATUS_ORDER.map((s) => (
            <div key={s} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {tasks && tasks.length === 0 && (
        <Card className="bg-white/40 backdrop-blur-md border-white/40">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center mb-4">
              <ListChecks className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="font-medium text-slate-900">Nenhuma tarefa ainda</h3>
            <p className="text-sm text-slate-500 mt-1">Crie pendências como &ldquo;Fechar buffet&rdquo; ou &ldquo;Provar bolo&rdquo;.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setEditing(null); setOpen(true); }}>
              Adicionar primeira tarefa
            </Button>
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 items-start">
          {TASK_STATUS_ORDER.map((status) => {
            const column = tasks.filter((t) => t.status === status);
            const meta = TASK_STATUS_META[status];
            return (
              <section key={status} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-medium text-slate-700">{meta.column}</h2>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", meta.badge)}>{column.length}</span>
                </div>
                <div className="space-y-3 min-h-[3rem]">
                  {column.map((t) => {
                    const due = dueStatus(t.dueDate, t.status);
                    return (
                      <Card
                        key={t.id}
                        className={cn(
                          "bg-white/50 backdrop-blur-md border-white/50 transition-all hover:shadow-md hover:-translate-y-0.5",
                          t.status === "COMPLETED" && "opacity-70",
                        )}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={t.status === "COMPLETED"}
                              aria-label={t.status === "COMPLETED" ? "Reabrir tarefa" : "Concluir tarefa"}
                              onClick={() => toggleDone(t)}
                              className={cn(
                                "mt-0.5 h-5 w-5 shrink-0 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                                t.status === "COMPLETED"
                                  ? "bg-money-600 border-money-600 text-white"
                                  : "border-slate-300 hover:border-money-500",
                              )}
                            >
                              {t.status === "COMPLETED" && <CheckIcon />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={cn("font-medium text-slate-900 break-words", t.status === "COMPLETED" && "line-through text-slate-500")}>
                                {t.title}
                              </p>
                              {t.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-7 text-xs">
                            {t.category && (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Tag className="h-3 w-3" /> {t.category}
                              </span>
                            )}
                            {t.dueDate && (
                              <span className={cn("inline-flex items-center gap-1", DUE_STYLE[due])}>
                                <CalendarClock className="h-3 w-3" />
                                {fmtDate(t.dueDate)}
                                {DUE_LABEL[due] && <span>· {DUE_LABEL[due]}</span>}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1 pl-6 pt-1 border-t border-slate-100">
                            <Button variant="ghost" size="sm" onClick={() => cycleStatus(t)} disabled={setStatus.isPending}>
                              Avançar
                            </Button>
                            <div className="ml-auto flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setOpen(true); }} aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {column.length === 0 && (
                    <p className="text-sm text-slate-400 px-1 py-6 text-center border border-dashed border-slate-200 rounded-xl">Vazio</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TaskDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSave={(b) => save.mutate(b)}
        pending={save.isPending}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TaskDialog({
  open, onOpenChange, editing, onSave, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Task | null;
  onSave: (body: object) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [status, setStatus] = useState<Task["status"]>(editing?.status ?? "PENDING");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    editing?.dueDate ? new Date(editing.dueDate) : undefined
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              title,
              description: description || undefined,
              category: category || undefined,
              status,
              dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            });
          }}
        >
          <div><Label htmlFor="tt">Título</Label><Input id="tt" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Fechar contrato do buffet" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="tc">Categoria</Label><Input id="tc" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Fornecedores" /></div>
            <div>
              <Label>Vencimento</Label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
          </div>
          <div><Label htmlFor="ts">Status</Label>
            <Select id="ts" value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
              {TaskStatus.options.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
            </Select>
          </div>
          <div><Label htmlFor="tdesc">Descrição (opcional)</Label><Textarea id="tdesc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <Button type="submit" variant="gold" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
