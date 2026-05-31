import { ClipboardX, FileSpreadsheet, PhoneCall, Layers } from "lucide-react";

const pains = [
  {
    icon: ClipboardX,
    title: "RSVP no improviso",
    body: "Confirmações por mensagem, papel e ligações se perdem. Ninguém sabe ao certo quantos vêm — nem o que cada convidado pode comer.",
  },
  {
    icon: FileSpreadsheet,
    title: "Planilhas que se contradizem",
    body: "Versões duplicadas da lista de convidados em e-mails e celulares diferentes. Cada edição abre espaço para erro no dia.",
  },
  {
    icon: PhoneCall,
    title: "Tudo concentrado em uma pessoa",
    body: "Quando a informação vive na cabeça (ou no WhatsApp) de quem organiza, qualquer ausência trava o planejamento inteiro.",
  },
  {
    icon: Layers,
    title: "Nada conversa entre si",
    body: "Orçamento de um lado, convidados de outro, mesas em um terceiro arquivo. Sem visão única, decisões viram adivinhação.",
  },
];

export function LandingPainPoints() {
  return (
    <section id="dores" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Por que tanto estresse?
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Organizar um casamento não deveria ser um segundo emprego
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Os mesmos problemas se repetem em quase todo evento. Reconhece algum deles?
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {pains.map((pain, i) => (
            <article
              key={pain.title}
              className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-500">
                <pain.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{pain.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{pain.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
