import type { TaskStatus } from "@/lib/validation/enums";

/** Metadados de exibição por status. Ordem = colunas do board. */
export const TASK_STATUS_ORDER = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; badge: string; column: string }
> = {
  PENDING: {
    label: "Pendente",
    badge: "bg-slate-100 text-slate-600",
    column: "A fazer",
  },
  IN_PROGRESS: {
    label: "Em andamento",
    badge: "bg-amber-100 text-amber-700",
    column: "Em andamento",
  },
  COMPLETED: {
    label: "Concluída",
    badge: "bg-money-100 text-money-700",
    column: "Concluídas",
  },
};

export type DueStatus = "none" | "overdue" | "today" | "soon" | "upcoming";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Diferença em dias-calendário (meia-noite local) entre due e now. */
function dayDiff(due: Date, now: Date): number {
  const a = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

/**
 * Classifica o vencimento de uma tarefa relativa a `now`.
 * Tarefas COMPLETED nunca exibem urgência — sempre "none".
 */
export function dueStatus(
  dueDate: string | Date | null | undefined,
  status: TaskStatus,
  now: Date = new Date(),
): DueStatus {
  if (!dueDate || status === "COMPLETED") return "none";
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  if (Number.isNaN(due.getTime())) return "none";

  const diff = dayDiff(due, now);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "soon";
  return "upcoming";
}

/** Conta tarefas que ainda exigem ação (não concluídas). */
export function pendingCount(tasks: { status: string }[]): number {
  return tasks.filter((t) => t.status !== "COMPLETED").length;
}
