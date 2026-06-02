"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/#dores", label: "Desafios" },
  { href: "/#solucao", label: "Solução" },
  { href: "/pricing", label: "Planos" },
];

export function LandingNav() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (Math.abs(delta) < 10) return;

      setIsVisible(delta < 0);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed w-full top-0 z-50 px-4 pt-4 transition-transform duration-700 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/40 bg-white/40 px-5 py-3 shadow-sm backdrop-blur-lg">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-slate-900">
            <Heart className="h-4 w-4" aria-hidden />
          </span>
          Atelier
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="transition-colors hover:text-slate-900">
              {s.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button variant="gold" size="sm">Criar conta</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
