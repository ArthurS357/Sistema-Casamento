"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/#dores", label: "Desafios" },
  { href: "/#solucao", label: "Solução" },
  { href: "/pricing", label: "Planos" },
];

const TYPEWRITER_PHRASES = [
  "Organize seu grande dia...",
  "Receba presentes via PIX...",
  "Gestão fácil de convidados...",
  "Mesas dispostas em segundos...",
  "Orçamento sob controle total...",
];

export function LandingNav() {
  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const typewriterText = useTypewriter({
    phrases: TYPEWRITER_PHRASES,
    typingSpeed: 70,
    deletingSpeed: 35,
    pauseDelay: 2200,
  });

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

  /* Lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header
      className={cn(
        "fixed w-full top-0 z-50 px-4 pt-4 transition-transform duration-700 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/40 bg-white/40 px-5 py-3 shadow-sm backdrop-blur-lg">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg text-slate-900"
          onClick={closeMenu}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-slate-900">
            <Heart className="h-4 w-4" aria-hidden />
          </span>
          Atelier
        </Link>

        {/* Typewriter — mobile only */}
        <span
          className="block text-xs font-medium text-gold-700 md:hidden min-w-0 truncate max-w-[140px] sm:max-w-[200px]"
          aria-live="polite"
          aria-label="Funcionalidades do Atelier"
        >
          {typewriterText}
          <span className="inline-block w-[2px] h-3.5 bg-gold-500 ml-0.5 animate-pulse align-text-bottom" />
        </span>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="transition-colors hover:text-slate-900"
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="gold" size="sm">
              Criar conta
            </Button>
          </Link>
        </div>

        {/* Mobile actions: Login CTA + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/login">
            <Button variant="gold" size="sm">
              Entrar
            </Button>
          </Link>
          <button
            id="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
            onClick={toggleMenu}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <div
        id="mobile-nav-panel"
        className={cn(
          "mt-2 mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-lg backdrop-blur-xl transition-all duration-500 ease-in-out md:hidden",
          menuOpen
            ? "max-h-80 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-gold-50 hover:text-slate-900"
              onClick={closeMenu}
            >
              {s.label}
            </a>
          ))}
          <hr className="my-2 border-slate-200/60" />
          <Link href="/register" onClick={closeMenu}>
            <Button variant="outline" size="sm" className="w-full">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
