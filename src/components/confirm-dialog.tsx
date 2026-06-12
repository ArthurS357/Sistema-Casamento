"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  /** Gatilho — tipicamente o botão de lixeira. Renderizado via `asChild`. */
  children: React.ReactNode;
  title: string;
  description: string;
  /** Texto do botão destrutivo. Default "Excluir". */
  confirmLabel?: string;
  /** Texto do botão de cancelar. Default "Cancelar". */
  cancelLabel?: string;
  /** Ação destrutiva. Disparada ao confirmar; o dialog fecha em seguida. */
  onConfirm: () => void;
}

/**
 * Confirmação unificada de ações destrutivas (auditoria U1). Intercepta o
 * clique no gatilho e exige uma segunda confirmação explícita antes de
 * executar `onConfirm`, substituindo exclusões em 1-clique e o
 * `window.confirm` nativo (que quebrava a identidade visual).
 *
 * @example
 * <ConfirmDialog
 *   title="Excluir convidado"
 *   description="Esta ação não pode ser desfeita."
 *   onConfirm={() => remove.mutate(g.id)}
 * >
 *   <Button variant="ghost" size="icon" aria-label="Excluir"><Trash2 /></Button>
 * </ConfirmDialog>
 */
export function ConfirmDialog({
  children,
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    onConfirm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent role="alertdialog" className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <Button variant="danger" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
