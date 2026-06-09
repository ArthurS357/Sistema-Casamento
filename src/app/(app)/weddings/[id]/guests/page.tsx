"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Link2, Share2, Crown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useActivePlan } from "@/lib/use-plan";
import { maxGuestsPerWedding } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RsvpStatus, RelType } from "@/lib/validation/enums";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvpStatus: string;
  rsvpToken: string;
  dietaryRestrictions: string | null;
  notes: string | null;
  seat?: { id: string; number: number; table: { name: string } } | null;
}

interface Relationship {
  id: string;
  type: string;
  guestId: string;
  relatedId: string;
  guest: { id: string; name: string };
  related: { id: string; name: string };
}

const RSVP_OPTIONS = RsvpStatus.options;
const REL_OPTIONS = RelType.options;
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-money-100 text-money-700",
  declined: "bg-red-100 text-red-700",
  maybe: "bg-amber-100 text-amber-700",
};

export default function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["guests", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/guests`),
  });
  const { data: rels } = useQuery<Relationship[]>({
    queryKey: ["rels", id],
    queryFn: () => apiFetch(`/api/weddings/${id}/relationships`),
  });

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!guests) return [];
    const term = search.trim().toLowerCase();
    return guests.filter(
      (g) =>
        (filter === "all" || g.rsvpStatus === filter) &&
        (!term || g.name.toLowerCase().includes(term) || (g.email ?? "").toLowerCase().includes(term)),
    );
  }, [guests, filter, search]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [relOpen, setRelOpen] = useState<Guest | null>(null);

  function copyRsvp(token: string) {
    navigator.clipboard?.writeText(`${window.location.origin}/rsvp/${token}`);
  }

  const save = useMutation({
    mutationFn: (body: object) => {
      if (editing) {
        return apiFetch(`/api/weddings/${id}/guests/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      return apiFetch(`/api/weddings/${id}/guests`, { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", id] });
      setOpen(false); setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (gid: string) => apiFetch(`/api/weddings/${id}/guests/${gid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests", id] }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-slate-900">Convidados</h1>
        <Button variant="gold" onClick={() => { setEditing(null); save.reset(); setOpen(true); }}><Plus className="h-4 w-4" /> Novo</Button>
      </header>

      {guests && <GuestLimitBanner count={guests.length} />}

      <Card><CardContent className="flex flex-wrap gap-3">
        <Input placeholder="Buscar por nome ou email…" value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-sm" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="md:max-w-xs">
          <option value="all">Todos status</option>
          {RSVP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Contato</th>
              <th className="text-left p-3">RSVP</th>
              <th className="text-left p-3">Assento</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {!guests &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-t border-slate-100">
                  <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3" />
                </tr>
              ))}
            {filtered.map((g) => (
              <tr key={g.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                <td className="p-3 font-medium">{g.name}</td>
                <td className="p-3 text-slate-500">{g.email ?? g.phone ?? "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[g.rsvpStatus] ?? ""}`}>{g.rsvpStatus}</span>
                </td>
                <td className="p-3 text-slate-500">
                  {g.seat ? `${g.seat.table.name} #${g.seat.number}` : "—"}
                </td>
                <td className="p-3 flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => copyRsvp(g.rsvpToken)} aria-label="Copiar link de RSVP"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setRelOpen(g)} aria-label="Relacionamentos"><Link2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setOpen(true); }} aria-label="Editar"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(g.id)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}
            {guests && guests.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="max-w-xs mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl text-slate-400">👋</span>
                    </div>
                    <h3 className="font-medium text-slate-900">Sua lista está vazia</h3>
                    <p className="text-sm text-slate-500">Adicione convidados para começar a planejar os assentos e o RSVP.</p>
                    <Button variant="outline" className="mt-4 w-full" onClick={() => { setEditing(null); setOpen(true); }}>
                      Adicionar convidado
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {guests && guests.length > 0 && filtered.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nenhum convidado encontrado na busca.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent></Card>

      <GuestDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) save.reset(); }}
        editing={editing}
        onSave={(body) => save.mutate(body)}
        pending={save.isPending}
        error={save.error?.message ?? null}
      />
      {relOpen && (
        <RelationshipDialog
          guest={relOpen}
          guests={guests ?? []}
          rels={(rels ?? []).filter((r) => r.guestId === relOpen.id || r.relatedId === relOpen.id)}
          weddingId={id}
          onClose={() => setRelOpen(null)}
        />
      )}
    </div>
  );
}

/**
 * Isca de conversão do plano Free: barra de progresso do teto de convidados
 * (ver PLAN_LIMITS.free.guests). Planos pagos (ilimitado) não renderizam nada.
 * O enforcement real é server-side no POST de convidados; aqui é só o visual.
 */
function GuestLimitBanner({ count }: { count: number }) {
  const { plan } = useActivePlan();
  const max = plan ? maxGuestsPerWedding(plan) : Infinity;
  if (!Number.isFinite(max)) return null;

  const pct = Math.min(100, Math.round((count / max) * 100));
  const atLimit = count >= max;
  const nearLimit = count >= max * 0.8;
  const tone = atLimit ? "bg-red-400" : nearLimit ? "bg-amber-400" : "bg-gold-400";

  return (
    <Card className={atLimit ? "border-red-200 bg-red-50/50" : nearLimit ? "border-amber-200 bg-amber-50/50" : ""}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{count}/{max}</span> convidados do plano Free
          </p>
          {nearLimit && (
            <Link href="/settings">
              <Button variant="gold" size="sm">
                <Crown className="h-4 w-4" /> Convidados ilimitados no Pro
              </Button>
            </Link>
          )}
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label="Uso do limite de convidados do plano Free"
        >
          <div className={`h-full rounded-full transition-all duration-300 ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        {atLimit && (
          <p className="text-xs text-red-600">
            Você atingiu o limite do plano Free. Faça upgrade para adicionar mais convidados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GuestDialog({
  open, onOpenChange, editing, onSave, pending, error,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Guest | null;
  onSave: (body: object) => void;
  pending: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [rsvp, setRsvp] = useState(editing?.rsvpStatus ?? "pending");
  const [dietary, setDietary] = useState(editing?.dietaryRestrictions ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar convidado" : "Novo convidado"}</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              name, email: email || undefined, phone: phone || undefined,
              rsvpStatus: rsvp,
              dietaryRestrictions: dietary || undefined,
              notes: notes || undefined,
            });
          }}
        >
          <div><Label htmlFor="n">Nome</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p">Telefone</Label><Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div><Label htmlFor="r">RSVP</Label>
            <Select id="r" value={rsvp} onChange={(e) => setRsvp(e.target.value)}>
              {RSVP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label htmlFor="d">Restrições alimentares</Label><Input id="d" value={dietary} onChange={(e) => setDietary(e.target.value)} /></div>
          <div><Label htmlFor="not">Notas</Label><Textarea id="not" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <Button type="submit" variant="gold" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RelationshipDialog({
  guest, guests, rels, weddingId, onClose,
}: {
  guest: Guest;
  guests: Guest[];
  rels: Relationship[];
  weddingId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<string>("friend");
  const [relatedId, setRelatedId] = useState<string>("");

  const create = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/relationships`, {
        method: "POST",
        body: JSON.stringify({ type, guestId: guest.id, relatedId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rels", weddingId] });
      setRelatedId("");
    },
  });
  const remove = useMutation({
    mutationFn: (rid: string) =>
      apiFetch(`/api/weddings/${weddingId}/relationships/${rid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rels", weddingId] }),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Relacionamentos de {guest.name}</DialogTitle></DialogHeader>
        <ul className="space-y-2 mb-4">
          {rels.length === 0 && <li className="text-sm text-slate-500">Nenhum.</li>}
          {rels.map((r) => {
            const other = r.guestId === guest.id ? r.related : r.guest;
            return (
              <li key={r.id} className="flex items-center justify-between border border-slate-100 rounded p-2">
                <span className="text-sm">{other.name} <span className="text-slate-400">— {r.type}</span></span>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)} aria-label="Remover"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </li>
            );
          })}
        </ul>
        <form
          className="grid grid-cols-[1fr_1fr_auto] gap-2"
          onSubmit={(e) => { e.preventDefault(); if (relatedId) create.mutate(); }}
        >
          <Select value={relatedId} onChange={(e) => setRelatedId(e.target.value)} required>
            <option value="">Convidado…</option>
            {guests.filter((g) => g.id !== guest.id).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {REL_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Button variant="gold" type="submit" disabled={create.isPending}>+</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
