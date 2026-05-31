"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: session } = useSession();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-3xl text-slate-900">Configurações</h1>
      <Card>
        <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-slate-500">Nome:</span> {session?.user?.name ?? "—"}</p>
          <p><span className="text-slate-500">Email:</span> {session?.user?.email ?? "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Plano</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <p><span className="px-2 py-1 rounded-full bg-gold-100 text-gold-700 text-xs">free</span></p>
          <Button variant="gold" onClick={() => alert("Em breve.")}>Upgrade</Button>
        </CardContent>
      </Card>
    </div>
  );
}
