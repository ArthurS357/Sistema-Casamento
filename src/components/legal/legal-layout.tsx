import type { ReactNode } from "react";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";

interface LegalLayoutProps {
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalLayout({ title, intro, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="bg-white">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:pt-44">
        <header className="border-b border-slate-200 pb-8">
          <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>
          <p className="mt-4 text-sm text-slate-400">Última atualização: {lastUpdated}</p>
        </header>
        <div className="mt-10 space-y-10">{children}</div>
      </main>
      <LandingFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-slate-900">{title}</h2>
      <div className="space-y-3 leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-1 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
