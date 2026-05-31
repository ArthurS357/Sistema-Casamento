import { Users, MailCheck, Wallet, LayoutGrid, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Lista de convidados viva",
    body: "Uma fonte única de verdade. Adicione, agrupe e acompanhe restrições alimentares e vínculos entre convidados.",
  },
  {
    icon: MailCheck,
    title: "RSVP por link, sem login",
    body: "Cada convidado confirma presença em segundos pelo celular, por um link exclusivo e seguro. As respostas chegam organizadas.",
  },
  {
    icon: Wallet,
    title: "Orçamento sob controle",
    body: "Despesas, vencimentos e valores pagos lado a lado. Saiba a qualquer momento quanto falta e para onde vai cada real.",
  },
  {
    icon: LayoutGrid,
    title: "Mesas e assentos visuais",
    body: "Monte o salão arrastando convidados para as mesas, respeitando capacidade, formato e quem senta perto de quem.",
  },
  {
    icon: BarChart3,
    title: "Relatórios que decidem por você",
    body: "Confirmados, pendentes, custos por categoria — os números que importam, prontos quando você precisar.",
  },
  {
    icon: ShieldCheck,
    title: "Cada casamento isolado",
    body: "Arquitetura multi-tenant: seus dados e os de cada evento ficam separados, acessíveis só por quem você autoriza.",
  },
];

export function LandingSolution() {
  return (
    <section id="solucao" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-600">
            Tudo em um só lugar
          </p>
          <h2 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Um ateliê digital para o casamento inteiro
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Centralize convidados, confirmações, finanças e logística — e chegue ao
            grande dia com a tranquilidade de quem sabe que está tudo certo.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              style={{ animationDelay: `${(i % 3) * 80}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-600 transition-colors group-hover:bg-gold-100">
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
