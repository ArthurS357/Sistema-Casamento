import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gold-50 via-white to-rose-50 px-4 py-12">
      {/* Atmosfera: blobs desfocados para profundidade premium */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-1/4 top-1/3 h-44 w-44 rounded-full bg-gold-100/50 blur-3xl" />

      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors duration-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 animate-in fade-in slide-in-from-left-4 fill-mode-both duration-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <section className="w-full max-w-md rounded-2xl border border-white/50 bg-white/80 p-8 shadow-xl backdrop-blur-md sm:p-10 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 ease-out">
        <header className="mb-8 text-center flex flex-col items-center">
          <Image src="/android-chrome-192x192.png" alt="Atelier do Sim Logo" width={48} height={48} className="mb-4 h-12 w-auto object-contain" priority />
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        </header>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </section>
    </main>
  );
}
