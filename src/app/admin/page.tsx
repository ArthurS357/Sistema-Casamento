import { AdminBackoffice } from "@/components/admin/admin-backoffice";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-slate-900">Centro de Comando</h1>
        <p className="mt-1 text-sm text-slate-500">
          Métricas, gestão de usuários, auditoria e anúncios globais.
        </p>
      </div>
      <AdminBackoffice />
    </div>
  );
}
