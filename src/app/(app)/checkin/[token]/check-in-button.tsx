"use client";
import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "done" | "already" | "error";

/**
 * Botão de check-in para uso em pé, no celular, na porta do evento:
 * alvo de toque grande e feedback inequívoco (verde = entrou, âmbar =
 * QR já usado antes — possível duplicata na recepção).
 */
export function CheckInButton({ token, initialAttended }: { token: string; initialAttended: boolean }) {
  const [status, setStatus] = useState<Status>(initialAttended ? "already" : "idle");

  async function checkIn() {
    setStatus("sending");
    try {
      const res = await fetch(`/api/checkin/${token}`, { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data: { alreadyCheckedIn: boolean } = await res.json();
      setStatus(data.alreadyCheckedIn ? "already" : "done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl bg-money-600 px-4 py-5 text-white animate-fade-up"
        role="status"
      >
        <CheckCircle2 className="h-7 w-7" />
        <span className="text-lg font-semibold">Presença registrada!</span>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-amber-700 animate-fade-up"
        role="status"
      >
        <AlertTriangle className="h-6 w-6" />
        <span className="text-base font-medium">Check-in já realizado anteriormente</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {status === "error" && (
        <p className="text-center text-sm text-red-600" role="alert">
          Não foi possível registrar. Tente novamente.
        </p>
      )}
      <Button
        variant="gold"
        size="lg"
        className="w-full h-16 text-lg"
        disabled={status === "sending"}
        onClick={checkIn}
      >
        <CheckCircle2 className="h-6 w-6" />
        {status === "sending" ? "Registrando…" : "Marcar presença"}
      </Button>
    </div>
  );
}
