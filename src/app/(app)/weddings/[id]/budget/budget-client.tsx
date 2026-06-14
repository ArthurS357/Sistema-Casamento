"use client";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Sparkles, Loader2, Camera } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/money";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExpenseCategory } from "@/lib/validation/enums";
import { EXPENSE_CATEGORY_LABELS, labelFor } from "@/lib/labels";
import { useActivePlan } from "@/lib/use-plan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  paid: number;
  dueDate: string | null;
}

interface ScannedReceipt {
  category?: string;
  description?: string;
  amountCents?: number;
  dueDate?: string | null;
}

const CATEGORIES = ExpenseCategory.options;

export function BudgetClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { isPremium } = useActivePlan();

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["expenses", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/expenses`),
  });
  const { data: wedding } = useQuery<{ budgetTotal: number }>({
    queryKey: ["wedding", id],
    queryFn: () => apiFetch(`/api/weddings/${id}`),
  });

  const create = useMutation({
    mutationFn: (body: object) =>
      apiFetch(`/api/weddings/${id}/expenses`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", id] });
      toast.success("Despesa adicionada.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível adicionar a despesa."),
  });
  const update = useMutation({
    mutationFn: ({ eid, body }: { eid: string; body: object }) =>
      apiFetch(`/api/weddings/${id}/expenses/${eid}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", id] }),
  });
  const remove = useMutation({
    mutationFn: (eid: string) =>
      apiFetch(`/api/weddings/${id}/expenses/${eid}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", id] });
      toast.success("Despesa removida.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível remover a despesa."),
  });

  const totals = (expenses ?? []).reduce(
    (acc, e) => ({ amount: acc.amount + e.amount, paid: acc.paid + e.paid }),
    { amount: 0, paid: 0 },
  );
  const budgetTotal = wedding?.budgetTotal ?? 0;
  const pct = budgetTotal > 0 ? Math.min(100, Math.round((totals.amount / budgetTotal) * 100)) : 0;
  const premiumCard = isPremium
    ? "border-gold-200 bg-gradient-to-br from-white to-gold-50/40 shadow-md shadow-gold-100/40"
    : "";

  const [category, setCategory] = useState<string>("venue");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [scannedDueDate, setScannedDueDate] = useState<string | null>(null);

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      category,
      description: description || undefined,
      amount: amount || 0,
      paid: 0,
      ...(scannedDueDate ? { dueDate: scannedDueDate } : {}),
    });
    setDescription(""); setAmount(undefined); setScannedDueDate(null);
  }

  function applyScannedReceipt(r: ScannedReceipt) {
    if (r.category) setCategory(r.category);
    if (r.description) setDescription(r.description);
    if (typeof r.amountCents === "number") setAmount(r.amountCents);
    setScannedDueDate(r.dueDate ?? null);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-slate-900">Orçamento</h1>
        <BudgetWithLiaButton weddingId={id} />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cn(premiumCard)}><CardContent>
          <p className="text-sm text-slate-500">Total previsto</p>
          <p className="text-2xl font-semibold text-money-600">{formatBRL(totals.amount)}</p>
        </CardContent></Card>
        <Card className={cn(premiumCard)}><CardContent>
          <p className="text-sm text-slate-500">Total pago</p>
          <p className="text-2xl font-semibold text-money-700">{formatBRL(totals.paid)}</p>
        </CardContent></Card>
        <Card className={cn(premiumCard)}><CardContent>
          <p className="text-sm text-slate-500">Orçamento</p>
          <p className="text-2xl font-semibold">{formatBRL(budgetTotal)}</p>
          <div className="mt-2 h-2 bg-slate-100 rounded overflow-hidden">
            <div className={`h-full ${pct > 100 ? "bg-red-500" : "bg-money-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{pct}% comprometido</p>
        </CardContent></Card>
      </div>

      <Card><CardContent>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Adicione uma despesa ou deixe a Lia ler um comprovante para você.</p>
          <ReceiptScanButton weddingId={id} onScanned={applyScannedReceipt} />
        </div>
        {scannedDueDate && (
          <p className="mb-2 text-xs text-gold-600">
            ✨ Vencimento lido do comprovante: {new Date(scannedDueDate).toLocaleDateString("pt-BR")}
          </p>
        )}
        <form className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto]" onSubmit={addExpense}>
          <div>
            <Label htmlFor="cat">Categoria</Label>
            <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{labelFor(EXPENSE_CATEGORY_LABELS, c)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="desc">Descrição</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="val">Valor</Label>
            <CurrencyInput id="val" required value={amount} onChange={setAmount} placeholder="R$ 0,00" />
          </div>
          <div className="flex items-end">
            <Button variant="money" type="submit" disabled={create.isPending}><Plus className="h-4 w-4" /> Adicionar</Button>
          </div>
        </form>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Categoria</th>
              <th className="text-left p-3">Descrição</th>
              <th className="text-right p-3">Valor</th>
              <th className="text-right p-3">Pago</th>
              <th className="text-left p-3">Venc.</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {expenses?.map((e) => (
              <ExpenseRow key={e.id} expense={e} onUpdate={(body) => update.mutate({ eid: e.id, body })} onDelete={() => remove.mutate(e.id)} />
            ))}
            {expenses?.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhuma despesa.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

/**
 * Pede o orçamento total ao usuário e manda a Lia distribuir entre as
 * categorias (POST /ai/budget). O valor vai em centavos (convenção do
 * projeto); ao concluir invalida despesas e wedding para refletir na UI.
 */
function BudgetWithLiaButton({ weddingId }: { weddingId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const generate = useMutation<{ created: number }>({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/ai/budget`, {
        method: "POST",
        body: JSON.stringify({ total }),
      }),
    onSuccess: ({ created }) => {
      qc.invalidateQueries({ queryKey: ["expenses", weddingId] });
      qc.invalidateQueries({ queryKey: ["wedding", weddingId] });
      setOpen(false);
      setTotal(undefined);
      if (created > 0) toast.success(`A Lia distribuiu seu orçamento em ${created} categoria${created > 1 ? "s" : ""}.`);
      else toast.info("A Lia não conseguiu montar o orçamento. Tente novamente.");
    },
    onError: (e: Error) => toast.error(e.message || "A Lia não conseguiu orçar."),
  });
  const pending = generate.isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Orçar com Lia"
        className={cn(
          "group relative inline-flex items-center gap-2 overflow-hidden rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all",
          "bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600",
          "hover:shadow-md hover:brightness-105 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
        )}
      >
        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
        ✨ Orçar com Lia
      </button>

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-500" /> Orçar com a Lia
            </DialogTitle>
            <DialogDescription>
              Informe o valor total disponível e a Lia distribui automaticamente entre as categorias (buffet, local, fotografia, etc.).
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); if (total && total > 0) generate.mutate(); }}
          >
            <div>
              <Label htmlFor="lia-total">Orçamento total</Label>
              <CurrencyInput id="lia-total" value={total} onChange={setTotal} placeholder="R$ 50.000,00" required />
            </div>
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={pending || !total || total <= 0}
            >
              {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> A Lia está pensando…</> : "Distribuir orçamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReceiptScanButton({ weddingId, onScanned }: { weddingId: string; onScanned: (r: ScannedReceipt) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch(`/api/weddings/${weddingId}/ai/scan-receipt`, {
        method: "POST",
        body: formData,
      });
      onScanned(result as ScannedReceipt);
      toast.success("Comprovante lido pela Lia!");
    } catch (err) {
      toast.error((err as Error).message || "A Lia não conseguiu ler o comprovante.");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} aria-label="Escanear comprovante" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
        aria-label="Escanear comprovante com Lia"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60",
        )}
      >
        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {scanning ? "Lendo…" : "Escanear comprovante"}
      </button>
    </>
  );
}

function ExpenseRow({
  expense, onUpdate, onDelete,
}: {
  expense: Expense;
  onUpdate: (body: object) => void;
  onDelete: () => void;
}) {
  const [paid, setPaid] = useState<number | undefined>(expense.paid);
  const [amount, setAmount] = useState<number | undefined>(expense.amount);
  const [desc, setDesc] = useState(expense.description ?? "");

  function blur(field: "paid" | "amount" | "description") {
    const body: Record<string, unknown> = {};
    if (field === "paid") body.paid = paid || 0;
    if (field === "amount") body.amount = amount || 0;
    if (field === "description") body.description = desc || undefined;
    onUpdate(body);
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="p-3">{labelFor(EXPENSE_CATEGORY_LABELS, expense.category)}</td>
      <td className="p-3">
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => blur("description")} className="h-8" />
      </td>
      <td className="p-3 text-right">
        <CurrencyInput value={amount} onChange={setAmount} onBlur={() => blur("amount")} className="h-8 text-right" />
      </td>
      <td className="p-3 text-right">
        <CurrencyInput value={paid} onChange={setPaid} onBlur={() => blur("paid")} className="h-8 text-right" />
      </td>
      <td className="p-3 text-slate-500">
        {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString("pt-BR") : "—"}
      </td>
      <td className="p-3">
        <ConfirmDialog
          title="Excluir despesa"
          description={`Remover "${expense.description || expense.category}" do orçamento? Esta ação não pode ser desfeita.`}
          onConfirm={onDelete}
        >
          <Button variant="ghost" size="icon" aria-label="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </ConfirmDialog>
      </td>
    </tr>
  );
}
