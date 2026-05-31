"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";

interface Report {
  wedding: { title: string; date: string; budgetTotal: number };
  finance: {
    budgetTotal: number; totalAmount: number; totalPaid: number; remaining: number;
    byCategory: Record<string, { amount: number; paid: number }>;
    upcoming: { id: string; category: string; description: string | null; amount: number; paid: number; dueDate: string | null }[];
  };
  guests: { total: number; rsvp: Record<string, number>; list: { id: string; name: string; rsvpStatus: string; email: string | null }[] };
}

const COLORS = ["#D4AF37", "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#A855F7", "#64748B"];

export default function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useQuery<Report>({
    queryKey: ["report", id], queryFn: () => apiFetch(`/api/weddings/${id}/reports`),
  });

  if (!data) return <p className="text-slate-500">Carregando…</p>;
  const d = data;

  const pieData = Object.entries(d.finance.byCategory).map(([k, v]) => ({ name: k, value: v.amount }));
  const barData = Object.entries(d.finance.byCategory).map(([k, v]) => ({ name: k, previsto: v.amount / 100, pago: v.paid / 100 }));

  const exportGuestsCSV = () => {
    const header = "Nome,Email,RSVP\n";
    const rows = d.guests.list.map((g) => `"${g.name}","${g.email ?? ""}",${g.rsvpStatus}`).join("\n");
    download(header + rows, "convidados.csv");
  };
  const exportExpensesCSV = () => {
    const rows = Object.entries(d.finance.byCategory).map(
      ([k, v]) => `${k},${(v.amount / 100).toFixed(2)},${(v.paid / 100).toFixed(2)}`,
    ).join("\n");
    download("Categoria,Previsto,Pago\n" + rows, "despesas.csv");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-slate-900">Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExpensesCSV}><Download className="h-4 w-4" /> Despesas CSV</Button>
          <Button variant="outline" onClick={exportGuestsCSV}><Download className="h-4 w-4" /> Convidados CSV</Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent>
          <p className="text-sm text-slate-500">Orçamento</p>
          <p className="text-xl font-semibold">{formatBRL(d.finance.budgetTotal)}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-slate-500">Previsto</p>
          <p className="text-xl font-semibold text-money-600">{formatBRL(d.finance.totalAmount)}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-slate-500">Pago</p>
          <p className="text-xl font-semibold text-money-700">{formatBRL(d.finance.totalPaid)}</p>
        </CardContent></Card>
        <Card><CardContent>
          <p className="text-sm text-slate-500">Restante</p>
          <p className="text-xl font-semibold">{formatBRL(d.finance.remaining)}</p>
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent>
          <h3 className="font-semibold mb-3">Por categoria</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card><CardContent>
          <h3 className="font-semibold mb-3">Previsto vs Pago (R$)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="previsto" fill="#D4AF37" />
              <Bar dataKey="pago" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent>
          <h3 className="font-semibold mb-3">RSVP</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Total</span><strong>{d.guests.total}</strong></li>
            {Object.entries(d.guests.rsvp).map(([k, v]) => (
              <li key={k} className="flex justify-between text-slate-600"><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </CardContent></Card>
        <Card><CardContent>
          <h3 className="font-semibold mb-3">Próximos vencimentos</h3>
          {d.finance.upcoming.length === 0 && <p className="text-sm text-slate-500">Nenhum pendente.</p>}
          <ul className="space-y-2 text-sm">
            {d.finance.upcoming.map((e) => (
              <li key={e.id} className="flex justify-between border-b border-slate-100 pb-1">
                <span>{e.description ?? e.category}</span>
                <span className="text-slate-500">
                  {e.dueDate ? new Date(e.dueDate).toLocaleDateString("pt-BR") : "—"} · {formatBRL(e.amount - e.paid)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      </div>
    </div>
  );
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
