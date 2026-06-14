"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chat global da Lia (copiloto IA). FAB no canto inferior direito, empilhado
 * acima do HelpFab. `open`/`onOpenChange` são controlados pelo AppShell para
 * que a entrada "Lia" da sidebar também consiga abrir o chat.
 *
 * Vercel AI SDK v6: useChat não gerencia mais o input — mantemos o texto em
 * estado local e disparamos sendMessage({ text }). As mensagens são UIMessage
 * com `parts`; renderizamos apenas as partes de texto.
 */
export function LiaChatFab({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  // Fechado: só o botão redondo (acima do HelpFab, que fica em bottom-6).
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Abrir chat com a Lia"
        className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg shadow-gold-500/30 transition-all hover:from-gold-500 hover:to-gold-700 hover:shadow-xl active:scale-95 print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-black/15 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-gold-50 to-white px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base leading-tight text-slate-900">Lia</p>
          <p className="text-xs text-slate-500">Sua assessora de casamentos</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar chat"
          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-gold-400" />
            <p className="font-medium text-slate-700">Oi! Sou a Lia 💛</p>
            <p className="mt-1 leading-relaxed">
              Pergunte sobre cronograma, orçamento, fornecedores ou etiqueta do seu casamento.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          if (!text) return null;
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-sm bg-gold-500 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800",
                )}
              >
                {text}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2.5">
              <Dot /> <Dot className="[animation-delay:150ms]" /> <Dot className="[animation-delay:300ms]" />
            </div>
          </div>
        )}

        {status === "error" && (
          <p className="text-center text-xs text-red-500">
            {error?.message || "Algo deu errado. Tente novamente."}
          </p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <label htmlFor="lia-input" className="sr-only">Mensagem para a Lia</label>
        <input
          id="lia-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo à Lia…"
          disabled={busy}
          className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Enviar mensagem"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-500 text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function Dot({ className }: { className?: string }) {
  return <span className={cn("h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400", className)} />;
}
