"use client";
import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Sparkles, Loader2, Copy, Check, RefreshCw, Square } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Save the Date curto e elegante",
  "Mensagem de agradecimento aos padrinhos",
  "Convite formal para os pais",
  "Legenda romântica para a foto do casal",
];

/**
 * Escritor da Lia: modal global de redação por streaming. Usa `useCompletion`
 * (@ai-sdk/react) com `streamProtocol: "text"`, casado com a Rota 3 que devolve
 * `toTextStreamResponse()`. A rota é wedding-scoped, então recebe `weddingId`.
 */
export function LiaWriterModal({
  weddingId,
  open,
  onOpenChange,
}: {
  weddingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { completion, input, setInput, handleInputChange, handleSubmit, complete, isLoading, error, stop } =
    useCompletion({
      api: `/api/weddings/${weddingId}/ai/write-message`,
      streamProtocol: "text",
    });
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!completion) return;
    try {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-500" /> Escritor da Lia
          </DialogTitle>
          <DialogDescription>
            Diga o que você precisa escrever e a Lia redige para você — Save the Date, agradecimentos, convites, votos e mais.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="lia-writer-prompt">O que a Lia deve escrever?</Label>
            <Textarea
              id="lia-writer-prompt"
              value={input}
              onChange={handleInputChange}
              placeholder="Ex.: Uma mensagem de agradecimento carinhosa para os padrinhos do nosso casamento."
              rows={3}
              maxLength={2000}
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                disabled={isLoading}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="gold" className="flex-1" disabled={isLoading || !input.trim()}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> A Lia está escrevendo…</> : <><Sparkles className="h-4 w-4" /> Escrever</>}
            </Button>
            {isLoading && (
              <Button type="button" variant="outline" onClick={stop} aria-label="Parar geração">
                <Square className="h-4 w-4" /> Parar
              </Button>
            )}
          </div>
        </form>

        {error && (
          <p className="text-sm text-red-500">{error.message || "Algo deu errado. Tente novamente."}</p>
        )}

        {completion && (
          <div className="space-y-2">
            <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
              {completion}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => complete(input)} disabled={isLoading || !input.trim()}>
                <RefreshCw className="h-4 w-4" /> Refazer
              </Button>
              <Button type="button" variant="gold" size="sm" onClick={copy} disabled={isLoading}>
                {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
