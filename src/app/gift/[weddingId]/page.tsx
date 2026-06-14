"use client";
import { use, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicGiftList, type PublicGift } from "@/components/gift/public-gift-list";

interface PublicGifts {
  title: string;
  date: string;
  pixKey: string | null;
  partner1Name: string | null;
  partner2Name: string | null;
  photoUrls: string[];
  gifts: PublicGift[];
}

export default function PublicGiftsPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = use(params);
  const [data, setData] = useState<PublicGifts | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const coupleNames =
    data && (data.partner1Name || data.partner2Name)
      ? [data.partner1Name, data.partner2Name].filter(Boolean).join(" & ")
      : null;

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
        <header className="text-center space-y-3">
          <p className="uppercase tracking-[0.25em] text-xs text-gold-600 flex items-center justify-center gap-2">
            <Heart className="h-3.5 w-3.5" /> Você está convidado(a)
          </p>
          {loading ? (
            <Skeleton className="h-12 w-2/3 mx-auto" />
          ) : (
            <h1 className="font-display text-4xl md:text-6xl text-slate-900 leading-tight">
              {coupleNames ?? data?.title ?? "Nosso Casamento"}
            </h1>
          )}
          {data && (
            <p className="text-slate-500 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
              <span className="h-px w-8 bg-gold-300" />
              {new Date(data.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              <span className="h-px w-8 bg-gold-300" />
            </p>
          )}

          {data && data.photoUrls.length > 0 && <PhotoGallery photos={data.photoUrls.slice(0, 5)} />}

          <p className="text-slate-600 max-w-lg mx-auto pt-2">
            Sua presença é o nosso maior presente. Mas se quiser nos mimar, escolha uma lembrança abaixo. 💛
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

        {data && (
          <PublicGiftList gifts={data.gifts} pixKey={data.pixKey} merchantName={data.title} />
        )}
      </div>
    </main>
  );
}

function PhotoGallery({ photos }: { photos: string[] }) {
  return (
    <div className="mx-auto max-w-3xl pt-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {photos.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={`overflow-hidden rounded-2xl border-4 border-white shadow-lg shadow-gold-100/50 ${
              i === 0 ? "h-56 w-full sm:w-80" : "h-28 w-28 sm:h-32 sm:w-32"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto do casal ${i + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
