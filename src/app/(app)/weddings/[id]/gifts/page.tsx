"use client";
import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit, Gift as GiftIcon, Check, ExternalLink, Copy, KeyRound, ImagePlus, X,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatBRL } from "@/lib/money";
import { useActivePlan } from "@/lib/use-plan";
import { Paywall } from "@/components/paywall";
import { PremiumGate } from "@/components/premium-gate";
import { toast } from "sonner";

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
  photoUrls: string[];
}

export default function GiftsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { isPremium } = useActivePlan();

  const { data: wedding } = useQuery<WeddingInfo>({
    queryKey: ["wedding", id],
    queryFn: () => apiFetch(`/api/weddings/${id}`),
  });
  const { data: gifts } = useQuery<Gift[]>({
    queryKey: ["gifts", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/gifts`),
    enabled: isPremium === true,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);

  const save = useMutation({
    mutationFn: (body: object) =>
      editing
        ? apiFetch(`/api/weddings/${id}/gifts/${editing.id}`, { method: "PUT", body: JSON.stringify(body) })
        : apiFetch(`/api/weddings/${id}/gifts`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts", id] });
      setOpen(false);
      setEditing(null);
      toast.success("Presente salvo.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o presente."),
  });

  const remove = useMutation({
    mutationFn: (gid: string) => apiFetch(`/api/weddings/${id}/gifts/${gid}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gifts", id] });
      toast.success("Presente removido.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível remover o presente."),
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
    toast.success("Link copiado!");
  }

  if (isPremium === false) {
    return (
      <Paywall
        title="Lista de Presentes"
        description="Receba presentes via PIX com QR Code automático e uma página linda para compartilhar com seus convidados."
        benefits={[
          "Página pública de presentes personalizada",
          "QR Code e PIX copia-e-cola gerados automaticamente",
          "Controle do que já foi presenteado",
        ]}
      />
    );
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
            <Copy className="h-4 w-4" /> Copiar link
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

      <PremiumGate feature="fotos-casal" fallback={null}>
        <PhotoManagerCard weddingId={id} photoUrls={wedding?.photoUrls ?? []} loading={!wedding} />
      </PremiumGate>

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
                    <ConfirmDialog
                      title="Excluir presente"
                      description={`Remover "${g.title}" da lista de presentes? Esta ação não pode ser desfeita.`}
                      onConfirm={() => remove.mutate(g.id)}
                    >
                      <Button variant="ghost" size="icon" aria-label="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </ConfirmDialog>
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

  useEffect(() => { setValue(pixKey ?? ""); }, [pixKey]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}`, {
        method: "PUT",
        body: JSON.stringify({ pixKey: value.trim() || null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding", weddingId] });
      toast.success("Chave PIX salva.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar a chave PIX."),
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
            {save.isPending ? "Salvando…" : "Salvar chave"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Gestão das fotos do convite virtual (até 5). Upload client-side via
 * Cloudinary (next-cloudinary); cada alteração persiste no banco com PATCH.
 * O array é a fonte da verdade local, espelhado do servidor por useEffect.
 */
function PhotoManagerCard({
  weddingId, photoUrls, loading,
}: {
  weddingId: string;
  photoUrls: string[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const [photos, setPhotos] = useState<string[]>(photoUrls);

  useEffect(() => { setPhotos(photoUrls); }, [photoUrls]);

  const save = useMutation({
    mutationFn: (next: string[]) =>
      apiFetch(`/api/weddings/${weddingId}`, { method: "PATCH", body: JSON.stringify({ photoUrls: next }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding", weddingId] });
      toast.success("Fotos atualizadas.");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar as fotos."),
  });

  function persist(next: string[]) {
    setPhotos(next);
    save.mutate(next);
  }
  function addPhoto(url: string) {
    if (photos.length >= 5 || photos.includes(url)) return;
    persist([...photos, url]);
  }
  function removePhoto(url: string) {
    persist(photos.filter((p) => p !== url));
  }

  const full = photos.length >= 5;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-1">
          <ImagePlus className="h-4 w-4 text-gold-500" />
          <h2 className="font-medium text-slate-900">Fotos do convite</h2>
          <span className="ml-auto text-xs text-slate-400">{photos.length}/5</span>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Até 5 fotos do casal exibidas na página pública de presentes.
        </p>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Foto do casal" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                disabled={save.isPending}
                aria-label="Remover foto"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {!full && (
            <CldUploadWidget
              uploadPreset={preset}
              options={{ multiple: false, sources: ["local", "url", "camera"] }}
              onSuccess={(result) => {
                const info = result?.info;
                if (info && typeof info === "object" && "secure_url" in info) {
                  addPhoto(String(info.secure_url));
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  disabled={loading || save.isPending || !preset}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-gold-300 hover:text-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs font-medium">Adicionar</span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>

        {!preset && (
          <p className="mt-2 text-xs text-amber-600">
            Configure <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> para habilitar o upload.
          </p>
        )}
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
  const [price, setPrice] = useState<number | undefined>(editing?.price);
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
              price: price || 0,
              imageUrl: imageUrl || undefined,
            });
          }}
        >
          <div><Label htmlFor="gt">Título</Label><Input id="gt" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cota de Lua de Mel" /></div>
          <div><Label htmlFor="gp">Valor</Label><CurrencyInput id="gp" required value={price} onChange={setPrice} placeholder="R$ 0,00" /></div>
          <div><Label htmlFor="gi">URL da imagem (opcional)</Label><Input id="gi" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></div>
          <div><Label htmlFor="gd">Descrição (opcional)</Label><Textarea id="gd" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <Button type="submit" variant="gold" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
