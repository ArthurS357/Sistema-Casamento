"use client";
import { use, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Gift as GiftIcon, Copy, Check, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/money";
import { generatePixPayload } from "@/lib/pix";

interface Gift {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPurchased: boolean;
}

interface PublicGifts {
  title: string;
  date: string;
  pixKey: string | null;
  gifts: Gift[];
}

export default function PublicGiftsPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = use(params);
  const [data, setData] = useState<PublicGifts | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Gift | null>(null);

  useEffect(() => {
    fetch(`/api/public/gifts/${weddingId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PublicGifts) => setData(d))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [weddingId]);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-gold-50 via-white to-money-50 px-5 py-12">
      <div className="mx-auto max-w-5xl space-y-10 animate-fade-up">
        <header className="text-center space-y-2">
          <p className="uppercase tracking-[0.25em] text-xs text-gold-600 flex items-center justify-center gap-2">
            <Heart className="h-3.5 w-3.5" /> Lista de presentes
          </p>
          {loading ? (
            <Skeleton className="h-10 w-2/3 mx-auto" />
          ) : (
            <h1 className="font-display text-4xl md:text-5xl text-slate-900">{data?.title ?? "Presentes"}</h1>
          )}
          {data && (
            <p className="text-slate-500">
              {new Date(data.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
          <p className="text-slate-600 max-w-lg mx-auto pt-2">
            Sua presença é o nosso maior presente. Mas se quiser nos mimar, escolha uma opção abaixo. 💛
          </p>
        </header>

        {notFound && <p className="text-center text-slate-500">Lista de presentes não encontrada.</p>}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`sk-${i}`} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {data && data.gifts.length === 0 && (
          <p className="text-center text-slate-500">Nenhum presente cadastrado ainda.</p>
        )}

        {data && data.gifts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.gifts.map((g) => (
              <GiftCard key={g.id} gift={g} onPick={() => setSelected(g)} canGift={Boolean(data.pixKey)} />
            ))}
          </div>
        )}
      </div>

      {selected && data?.pixKey && (
        <GiftModal
          gift={selected}
          pixKey={data.pixKey}
          merchantName={data.title}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

function GiftCard({ gift, onPick, canGift }: { gift: Gift; onPick: () => void; canGift: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
      <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-gold-100 to-money-100">
        {gift.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gift.imageUrl} alt={gift.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <GiftIcon className="h-10 w-10 text-gold-400" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="font-medium text-slate-900">{gift.title}</h3>
        {gift.description && <p className="text-sm text-slate-500 line-clamp-2">{gift.description}</p>}
        <p className="text-xl font-semibold text-money-600">{formatBRL(gift.price)}</p>
        {gift.isPurchased ? (
          <div className="flex items-center gap-2 rounded-md bg-money-50 px-3 py-2 text-sm text-money-700">
            <Check className="h-4 w-4" /> Já presenteado — obrigado!
          </div>
        ) : (
          <Button variant="gold" className="w-full" onClick={onPick} disabled={!canGift}>
            {canGift ? "Presentear" : "Indisponível"}
          </Button>
        )}
      </div>
    </div>
  );
}

function GiftModal({
  gift, pixKey, merchantName, onClose,
}: {
  gift: Gift;
  pixKey: string;
  merchantName: string;
  onClose: () => void;
}) {
  const [toast, setToast] = useState(false);

  const payload = useMemo(
    () =>
      generatePixPayload({
        pixKey,
        merchantName,
        merchantCity: "BRASIL",
        amountCents: gift.price,
        txid: gift.id.slice(0, 25),
      }),
    [pixKey, merchantName, gift.price, gift.id],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch {
      /* clipboard indisponível — usuário pode copiar manualmente do campo */
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Presentear: {gift.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-2xl font-semibold text-money-600">{formatBRL(gift.price)}</p>

          <div className="mx-auto w-fit rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <QRCodeSVG value={payload} size={200} level="M" marginSize={1} />
          </div>

          <p className="text-sm text-slate-500">
            Abra o app do seu banco, escolha PIX &gt; Ler QR Code, ou use o código abaixo.
          </p>

          <div className="text-left">
            <label htmlFor="pix-code" className="mb-1 block text-sm font-medium text-slate-700">PIX Copia e Cola</label>
            <textarea
              id="pix-code"
              readOnly
              value={payload}
              onFocus={(e) => e.currentTarget.select()}
              className="h-24 w-full resize-none break-all rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          <Button variant="gold" className="w-full" onClick={copy}>
            <Copy className="h-4 w-4" /> Copiar código PIX
          </Button>
        </div>
      </DialogContent>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          <Check className="h-4 w-4 text-money-400" /> Código PIX copiado!
          <button onClick={() => setToast(false)} aria-label="Fechar" className="ml-1 text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </Dialog>
  );
}
