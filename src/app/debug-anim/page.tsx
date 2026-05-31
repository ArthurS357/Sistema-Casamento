"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DebugAnimPage() {
  const [animated, setAnimated] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        Debug: Animações Tailwind
      </h1>

      <div
        className={cn(
          "h-20 w-20 rounded-lg transition-all duration-1000 transform",
          animated
            ? "translate-x-32 bg-red-500"
            : "translate-x-0 bg-blue-500",
        )}
      />

      <button
        type="button"
        onClick={() => setAnimated((prev) => !prev)}
        className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-700"
      >
        Animar
      </button>

      <p className="max-w-sm text-center text-sm text-slate-500">
        Se o quadrado se mover com transição suave de 1 segundo, o Tailwind
        está gerando as classes de transição corretamente no build.
      </p>
    </div>
  );
}
