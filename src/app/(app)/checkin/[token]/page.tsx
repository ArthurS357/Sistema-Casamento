import { ShieldAlert, SearchX, Lock, Users, UtensilsCrossed, Armchair, CalendarHeart } from "lucide-react";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { assertWeddingAccess, getWeddingPlan, AuthError } from "@/lib/auth/guards";
import { canAccessPremiumFeatures } from "@/lib/permissions";
import { CheckInButton } from "./check-in-button";

type Params = { params: Promise<{ token: string }> };

const RSVP_BADGE = {
  confirmed: { label: "Confirmou presença", className: "bg-money-600/10 text-money-700 border-money-600/20" },
  declined: { label: "Havia recusado o convite", className: "bg-red-50 text-red-600 border-red-200" },
  pending: { label: "Não respondeu ao convite", className: "bg-amber-50 text-amber-600 border-amber-200" },
} as const satisfies Record<string, { label: string; className: string }>;

function badgeFor(status: string) {
  return status in RSVP_BADGE ? RSVP_BADGE[status as keyof typeof RSVP_BADGE] : RSVP_BADGE.pending;
}

/** Card de estado vazio/erro, em pé na porta da festa: mensagem grande e direta. */
function StateCard({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <main className="min-h-[60dvh] flex items-center justify-center px-5">
      <div className="text-center space-y-3 max-w-sm">
        <div className="mx-auto w-fit rounded-full bg-slate-100 p-4">{icon}</div>
        <h1 className="font-display text-2xl text-slate-900">{title}</h1>
        <p className="text-slate-500">{message}</p>
      </div>
    </main>
  );
}

// Check-in do dia do evento (feature Pro/Gestor). Usada pelo assessor ou
// pelos noivos no celular, na porta da festa, ao escanear o QR do convidado.
export default async function CheckInPage({ params }: Params) {
  const user = await getAuthenticatedUser();
  const { token } = await params;

  const guest = await prisma.guest.findUnique({
    where: { rsvpToken: token },
    select: {
      id: true,
      name: true,
      rsvpStatus: true,
      companions: true,
      dietaryRestrictions: true,
      attended: true,
      weddingId: true,
      wedding: { select: { title: true, date: true } },
      seat: { select: { number: true, table: { select: { name: true } } } },
    },
  });

  if (!guest) {
    return (
      <StateCard
        icon={<SearchX className="h-8 w-8 text-slate-400" />}
        title="Convite não encontrado"
        message="Este QR Code não corresponde a nenhum convidado. Verifique se o convite pertence a este evento."
      />
    );
  }

  try {
    await assertWeddingAccess(guest.weddingId, user.id!);
  } catch (e) {
    if (e instanceof AuthError) {
      return (
        <StateCard
          icon={<ShieldAlert className="h-8 w-8 text-red-400" />}
          title="Acesso negado"
          message="Você não tem permissão para fazer check-in neste casamento. Peça acesso ao workspace responsável."
        />
      );
    }
    throw e;
  }

  const plan = await getWeddingPlan(guest.weddingId);
  if (!canAccessPremiumFeatures(plan)) {
    return (
      <StateCard
        icon={<Lock className="h-8 w-8 text-gold-500" />}
        title="Recurso Pro"
        message="O check-in via QR Code está disponível apenas nos planos Pro e Gestor. Faça upgrade para liberar."
      />
    );
  }

  const badge = badgeFor(guest.rsvpStatus);
  const weddingDate = new Date(guest.wedding.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-md px-5 py-8 space-y-6 animate-fade-up">
      <header className="text-center space-y-1">
        <p className="uppercase tracking-[0.25em] text-xs text-gold-600">Check-in</p>
        <h1 className="font-display text-2xl leading-tight text-slate-900">{guest.wedding.title}</h1>
        <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
          <CalendarHeart className="h-4 w-4" /> {weddingDate}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl text-slate-900">{guest.name}</h2>
          <span className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <dl className="space-y-3 text-base">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 shrink-0 text-slate-400" />
            <dt className="sr-only">Acompanhantes</dt>
            <dd className="text-slate-700">
              {guest.companions > 0
                ? `${guest.companions} acompanhante${guest.companions > 1 ? "s" : ""}`
                : "Sem acompanhantes"}
            </dd>
          </div>
          {guest.seat && (
            <div className="flex items-center gap-3">
              <Armchair className="h-5 w-5 shrink-0 text-slate-400" />
              <dt className="sr-only">Mesa</dt>
              <dd className="text-slate-700">
                {guest.seat.table.name}, assento {guest.seat.number}
              </dd>
            </div>
          )}
          {guest.dietaryRestrictions && (
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 shrink-0 text-slate-400" />
              <dt className="sr-only">Restrições alimentares</dt>
              <dd className="text-slate-700">{guest.dietaryRestrictions}</dd>
            </div>
          )}
        </dl>

        <CheckInButton token={token} initialAttended={guest.attended} />
      </section>
    </main>
  );
}
