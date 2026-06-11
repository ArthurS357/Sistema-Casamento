"use client";
import { use, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, X, PartyPopper, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Rsvp {
  name: string;
  rsvpStatus: string;
  dietaryRestrictions: string | null;
  wedding: { title: string; date: string };
  checkInAvailable: boolean;
}

/**
 * Ticket de check-in (feature Pro/Gestor): QR aponta para a rota
 * autenticada /checkin/[token], escaneada pela recepção no dia do evento.
 */
function CheckInTicket({ token }: { token: string }) {
  const checkInUrl = `${window.location.origin}/checkin/${token}`;
  return (
    <div className="mx-auto w-fit rounded-2xl border border-gold-200 bg-white shadow-sm overflow-hidden animate-fade-up">
      <div className="flex items-center justify-center gap-2 bg-gold-50 px-6 py-2.5 border-b border-dashed border-gold-200">
        <TicketCheck className="h-4 w-4 text-gold-600" />
        <p className="uppercase tracking-[0.2em] text-[11px] text-gold-600">Seu ingresso</p>
      </div>
      <div className="p-5">
        <QRCodeSVG value={checkInUrl} size={180} level="M" marginSize={1} />
      </div>
      <p className="px-6 pb-4 text-xs text-slate-500">
        Apresente este QR Code na entrada do evento.
      </p>
    </div>
  );
}

export default function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<Rsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dietary, setDietary] = useState("");
  const [sending, setSending] = useState<"confirmed" | "declined" | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Rsvp) => {
        setData(d);
        setDietary(d.dietaryRestrictions ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function answer(rsvpStatus: "confirmed" | "declined") {
    setSending(rsvpStatus);
    setErr(null);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rsvpStatus,
          dietaryRestrictions: rsvpStatus === "confirmed" ? dietary || undefined : undefined,
        }),
      });
      if (res.ok) setDone(rsvpStatus);
      else setErr("Não foi possível enviar sua resposta. Tente novamente.");
    } catch {
      setErr("Erro de conexão. Verifique sua internet.");
    } finally {
      setSending(null);
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-gold-50 via-white to-white px-5 py-10">
      <div className="w-full max-w-md animate-fade-up">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3 mx-auto" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        )}

        {!loading && notFound && (
          <p className="text-center text-slate-500">Convite não encontrado.</p>
        )}

        {!loading && data && done && (
          <div className="text-center space-y-4 animate-fade-up">
            <PartyPopper className="h-12 w-12 mx-auto text-gold-500" />
            <h1 className="font-display text-3xl text-slate-900">
              {done === "confirmed" ? "Presença confirmada!" : "Resposta registrada"}
            </h1>
            <p className="text-slate-500">
              {done === "confirmed"
                ? `Mal podemos esperar para celebrar com você, ${data.name.split(" ")[0]}.`
                : "Sentiremos sua falta. Obrigado por avisar."}
            </p>
            {done === "confirmed" && data.checkInAvailable && <CheckInTicket token={token} />}
          </div>
        )}

        {!loading && data && !done && (
          <div className="text-center space-y-6">
            <header className="space-y-1">
              <p className="uppercase tracking-[0.25em] text-xs text-gold-600">Você está convidado</p>
              <h1 className="font-display text-4xl leading-tight text-slate-900">{data.wedding.title}</h1>
              <p className="text-slate-500">
                {new Date(data.wedding.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </header>

            <p className="text-slate-700">
              Olá <span className="font-medium">{data.name}</span>, você poderá comparecer?
            </p>

            <div className="text-left">
              <Label htmlFor="diet">Restrições alimentares (opcional)</Label>
              <Input id="diet" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Ex.: vegetariano" />
            </div>

            {err && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-600 animate-in fade-in slide-in-from-top-2 text-left" role="alert">
                {err}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                disabled={sending !== null}
                onClick={() => answer("confirmed")}
              >
                <Check className="h-5 w-5" /> {sending === "confirmed" ? "Enviando…" : "Sim, estarei lá"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={sending !== null}
                onClick={() => answer("declined")}
              >
                <X className="h-5 w-5" /> {sending === "declined" ? "Enviando…" : "Não poderei ir"}
              </Button>
            </div>

            {data.rsvpStatus === "confirmed" && data.checkInAvailable && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-slate-500">Sua presença já está confirmada. Este é o seu ingresso:</p>
                <CheckInTicket token={token} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
