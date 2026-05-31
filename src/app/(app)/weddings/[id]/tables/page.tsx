"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { Plus, AlertTriangle, Heart, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TableShape } from "@/lib/validation/enums";
import { cn } from "@/lib/utils";

interface Seat { id: string; number: number; guest: { id: string; name: string } | null; }
interface Table { id: string; name: string; shape: string; capacity: number; seats: Seat[]; }
interface Guest { id: string; name: string; seatId: string | null; }
interface Relationship {
  id: string; type: string; guestId: string; relatedId: string;
  guest: { id: string; name: string }; related: { id: string; name: string };
}

const SHAPE_OPTIONS = TableShape.options;

export default function TablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: tables } = useQuery<Table[]>({
    queryKey: ["tables", id], queryFn: () => apiFetch(`/api/weddings/${id}/tables`),
  });
  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["guests", id], queryFn: () => apiFetch(`/api/weddings/${id}/guests`),
  });
  const { data: rels } = useQuery<Relationship[]>({
    queryKey: ["rels", id], queryFn: () => apiFetch(`/api/weddings/${id}/relationships`),
  });

  const moveGuest = useMutation({
    mutationFn: ({ guestId, seatId }: { guestId: string; seatId: string | null }) =>
      apiFetch(`/api/weddings/${id}/guests/${guestId}`, {
        method: "PUT", body: JSON.stringify({ seatId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables", id] });
      qc.invalidateQueries({ queryKey: ["guests", id] });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(ev: DragEndEvent) {
    const guestId = String(ev.active.id);
    const overId = ev.over?.id ? String(ev.over.id) : null;
    if (overId === "unassigned") moveGuest.mutate({ guestId, seatId: null });
    else if (overId?.startsWith("seat:")) moveGuest.mutate({ guestId, seatId: overId.slice(5) });
  }

  function seatHints(seat: Seat, table: Table): { conflicts: string[]; affinities: string[] } {
    if (!rels || !seat.guest) return { conflicts: [], affinities: [] };
    const tableGuestIds = new Set(table.seats.map((s) => s.guest?.id).filter(Boolean) as string[]);
    const conflicts: string[] = [];
    const affinities: string[] = [];
    for (const r of rels) {
      const involved = [r.guestId, r.relatedId];
      if (!involved.includes(seat.guest.id)) continue;
      const other = r.guestId === seat.guest.id ? r.related : r.guest;
      if (!tableGuestIds.has(other.id) || other.id === seat.guest.id) continue;
      if (r.type === "conflict") conflicts.push(other.name);
      else affinities.push(other.name);
    }
    return { conflicts, affinities };
  }

  const unassigned = (guests ?? []).filter((g) => !g.seatId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900">Mesas</h1>
        <NewTableButton weddingId={id} />
      </header>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Droppable id="unassigned">
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">Não alocados ({unassigned.length})</h2>
              <div className="flex flex-wrap gap-2">
                {unassigned.length === 0 && <p className="text-sm text-slate-400">Todos alocados.</p>}
                {unassigned.map((g) => <DraggableGuest key={g.id} id={g.id} name={g.name} />)}
              </div>
            </CardContent>
          </Card>
        </Droppable>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables?.map((t) => (
            <Card key={t.id}>
              <CardContent>
                <header className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg">{t.name}</h3>
                    <p className="text-xs text-slate-400">{t.shape} · {t.capacity} lugares</p>
                  </div>
                  <DeleteTableButton weddingId={id} tableId={t.id} />
                </header>
                <ul className="space-y-1">
                  {t.seats.map((s) => {
                    const hints = seatHints(s, t);
                    return (
                      <Droppable key={s.id} id={`seat:${s.id}`}>
                        <li className={cn(
                          "flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-dashed",
                          s.guest ? "border-slate-200 bg-slate-50" : "border-slate-200 text-slate-400",
                        )}>
                          <span className="text-xs font-mono text-slate-400 w-6">#{s.number}</span>
                          {s.guest ? <DraggableGuest id={s.guest.id} name={s.guest.name} /> : <span className="text-xs">vazio</span>}
                          <span className="ml-auto flex gap-1">
                            {hints.conflicts.length > 0 && (
                              <span title={`Conflito: ${hints.conflicts.join(", ")}`}><AlertTriangle className="h-4 w-4 text-amber-500" /></span>
                            )}
                            {hints.affinities.length > 0 && (
                              <span title={`Afinidade: ${hints.affinities.join(", ")}`}><Heart className="h-4 w-4 text-money-500" /></span>
                            )}
                          </span>
                        </li>
                      </Droppable>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DraggableGuest({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined;
  return (
    <button
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={cn(
        "px-2 py-1 rounded-md bg-gold-100 text-gold-700 text-xs cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      {name}
    </button>
  );
}

function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(isOver && "ring-2 ring-gold-400 rounded")}>
      {children}
    </div>
  );
}

function NewTableButton({ weddingId }: { weddingId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shape, setShape] = useState<string>("round");
  const [capacity, setCapacity] = useState("8");

  const create = useMutation({
    mutationFn: () => apiFetch(`/api/weddings/${weddingId}/tables`, {
      method: "POST", body: JSON.stringify({ name, shape, capacity: Number(capacity) }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables", weddingId] });
      setOpen(false); setName(""); setCapacity("8");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="gold"><Plus className="h-4 w-4" /> Nova mesa</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova mesa</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <div><Label htmlFor="n">Nome</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label htmlFor="s">Formato</Label>
            <Select id="s" value={shape} onChange={(e) => setShape(e.target.value)}>
              {SHAPE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div><Label htmlFor="c">Capacidade</Label>
            <Input id="c" type="number" min="1" max="50" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <Button variant="gold" type="submit" disabled={create.isPending} className="w-full">{create.isPending ? "Criando…" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTableButton({ weddingId, tableId }: { weddingId: string; tableId: string }) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => apiFetch(`/api/weddings/${weddingId}/tables/${tableId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables", weddingId] });
      qc.invalidateQueries({ queryKey: ["guests", weddingId] });
    },
  });
  return (
    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir mesa?")) remove.mutate(); }} aria-label="Excluir mesa">
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
