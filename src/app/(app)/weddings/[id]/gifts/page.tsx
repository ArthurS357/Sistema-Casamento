"use client";
import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit, Gift as GiftIcon, Check, ExternalLink, Copy, KeyRound,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, toCents, toReais } from "@/lib/money";

interface Gift {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPurchased: boolean;
}

interface WeddingInfo {
  id: string;
  title: string;
  pixKey: string | null;
}

export default function GiftsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: wedding } = useQuery<WeddingInfo>({
    queryKey: ["wedding", id],
    queryFn: () => apiFetch(`/api/weddings/${id}`),
  });
  const { data: gifts } = useQuery<Gift[]>({
    queryKey: ["gifts", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/gifts`),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [copied, setCopied] = useState(false);

  const save = useMutation({
    mutationFn: (body: object) =>
      editing
        ? apiFetch(`/api/weddings/${id}/gifts/${editing.id}`, { method: "PUT", body: JSON.stringify(body) })
        : apiFetch(`/api/weddings/${id}/gifts`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts", id] });
      setOpen(false);
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (gid: string) => apiFetch(`/api/weddings/${id}/gifts/${gid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gifts", id] }),
  });

  const togglePurchased = useMutation({
    mutationFn: (g: Gift) =>
      apiFetch(`/api/weddings/${id}/gifts/${g.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPurchased: !g.isPurchased }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gifts", id] }),
  });

  function copyPublicLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/gift/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Lista de Presentes</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastre itens e compartilhe a página com seus convidados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyPublicLink}>
            {copied ? <Check className="h-4 w-4 text-money-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
          <a href={`/gift/${id}`} target="_blank" rel="noreferrer">
            <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver página</Button>
          </a>
          <Button variant="gold" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo presente
          </Button>
        </div>
      </header>

      <PixKeyCard weddingId={id} pixKey={wedding?.pixKey ?? null} loading={!wedding} />

      {!gifts && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {gifts && gifts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gold-50 rounded-full flex items-center justify-center mb-4">
              <GiftIcon className="h-6 w-6 text-gold-500" />
            </div>
            <h3 className="font-medium text-slate-900">Nenhum presente ainda</h3>
            <p className="text-sm text-slate-500 mt-1">Adicione cotas de lua de mel, eletrodomésticos e mais.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setEditing(null); setOpen(true); }}>
              Adicionar primeiro presente
            </Button>
          </CardContent>
        </Card>
      )}

      {gifts && gifts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((g) => (
            <Card key={g.id} className={g.isPurchased ? "opacity-75" : ""}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{g.title}</h3>
                    <p className="text-lg font-semibold text-money-600">{formatBRL(g.price)}</p>
                  </div>
                  {g.isPurchased && (
                    <span className="shrink-0 px-2 py-1 rounded-full text-xs bg-money-100 text-money-700">Presenteado</span>
                  )}
                </div>
                {g.description && <p className="text-sm text-slate-500 line-clamp-2">{g.description}</p>}
                <div className="flex gap-1 pt-1 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={() => togglePurchased.mutate(g)} disabled={togglePurchased.isPending}>
                    <Check className={`h-4 w-4 ${g.isPurchased ? "text-money-600" : "text-slate-400"}`} />
                    {g.isPurchased ? "Reabrir" : "Marcar dado"}
                  </Button>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setOpen(true); }} aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(g.id)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GiftDialog key={editing?.id ?? "new"} open={open} onOpenChange={setOpen} editing={editing} onSave={(b) => save.mutate(b)} pending={save.isPending} />
    </div>
  );
}

function PixKeyCard({ weddingId, pixKey, loading }: { weddingId: string; pixKey: string | null; loading: boolean }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(pixKey ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => { setValue(pixKey ?? ""); }, [pixKey]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}`, {
        method: "PUT",
        body: JSON.stringify({ pixKey: value.trim() || null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding", weddingId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-gold-500" />
          <h2 className="font-medium text-slate-900">Chave PIX recebedora</h2>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Usada para gerar o QR Code e o &ldquo;copia e cola&rdquo; de cada presente. CPF, e-mail, telefone ou chave aleatória.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ex.: noivos@email.com"
            disabled={loading}
            aria-label="Chave PIX"
          />
          <Button type="submit" variant="gold" disabled={save.isPending || loading} className="sm:w-auto">
            {saved ? <Check className="h-4 w-4" /> : null}
            {save.isPending ? "Salvando…" : saved ? "Salvo!" : "Salvar chave"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GiftDialog({
  open, onOpenChange, editing, onSave, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Gift | null;
  onSave: (body: object) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(editing ? String(toReais(editing.price)) : "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar presente" : "Novo presente"}</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              title,
              description: description || undefined,
              price: toCents(Number(price) || 0),
              imageUrl: imageUrl || undefined,
            });
          }}
        >
          <div><Label htmlFor="gt">Título</Label><Input id="gt" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cota de Lua de Mel" /></div>
          <div><Label htmlFor="gp">Valor (R$)</Label><Input id="gp" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" /></div>
          <div><Label htmlFor="gi">URL da imagem (opcional)</Label><Input id="gi" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
          <div><Label htmlFor="gd">Descrição (opcional)</Label><Textarea id="gd" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <Button type="submit" variant="gold" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
