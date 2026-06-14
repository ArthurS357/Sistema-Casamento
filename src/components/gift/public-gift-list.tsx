"use client";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Gift as GiftIcon, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/money";
import { generatePixPayload } from "@/lib/pix";
import { cn } from "@/lib/utils";

export interface PublicGift {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPurchased: boolean;
}

/**
 * Vitrine pública de presentes (experiência do convidado). Grid de cards;
 * ao escolher um item disponível abre o modal de PIX com o valor exato
 * pré-preenchido. Presentes já presenteados ficam visualmente esgotados.
 *
 * `pixKey` é a chave recebedora do casal; sem ela o botão fica indisponível.
 * `merchantName` nomeia o recebedor no BR Code (cai para "RECEBEDOR" se vazio).
 */
export function PublicGiftList({
  gifts,
  pixKey,
  merchantName,
}: {
  gifts: PublicGift[];
  pixKey: string | null;
  merchantName: string;
}) {
  const [selected, setSelected] = useState<PublicGift | null>(null);
  const canGift = Boolean(pixKey);

  if (gifts.length === 0) {
    return <p className="text-center text-slate-500">Nenhum presente cadastrado ainda.</p>;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gifts.map((g) => (
          <GiftCard key={g.id} gift={g} onPick={() => setSelected(g)} canGift={canGift} />
        ))}
      </div>

      {selected && pixKey && (
        <GiftModal
          gift={selected}
          pixKey={pixKey}
          merchantName={merchantName}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function GiftCard({ gift, onPick, canGift }: { gift: PublicGift; onPick: () => void; canGift: boolean }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 shadow-xl backdrop-blur-md transition-transform duration-300",
        gift.isPurchased ? "opacity-60 saturate-50" : "hover:-translate-y-1",
      )}
    >
      <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-gold-100 to-money-100">
        {gift.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gift.imageUrl}
            alt={gift.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              !gift.isPurchased && "group-hover:scale-105",
            )}
          />
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
  gift: PublicGift;
  pixKey: string;
  merchantName: string;
  onClose: () => void;
}) {
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
      toast.success("Código PIX copiado!");
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
    </Dialog>
  );
}
