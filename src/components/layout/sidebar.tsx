"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Wallet, Users, Armchair, BarChart3, Settings, LogOut, Menu, X, Heart, Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const globalNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const weddingMatch = pathname.match(/^\/weddings\/([^/]+)/);
  const weddingId = weddingMatch?.[1];

  const weddingNav: NavItem[] = weddingId
    ? [
        { href: `/weddings/${weddingId}`, label: "Visão geral", icon: Heart },
        { href: `/weddings/${weddingId}/budget`, label: "Orçamento", icon: Wallet },
        { href: `/weddings/${weddingId}/guests`, label: "Convidados", icon: Users },
        { href: `/weddings/${weddingId}/tables`, label: "Mesas", icon: Armchair },
        { href: `/weddings/${weddingId}/gifts`, label: "Presentes", icon: Gift },
        { href: `/weddings/${weddingId}/reports`, label: "Relatórios", icon: BarChart3 },
      ]
    : [];

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-white border border-slate-200 shadow"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2 font-display text-xl">
            <Heart className="h-5 w-5 text-gold-400" />
            Wedding
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          <Section title="Geral" items={globalNav} pathname={pathname} />
          {weddingNav.length > 0 && <Section title="Casamento" items={weddingNav} pathname={pathname} />}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}

function Section({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="px-3 mb-1 text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <ul className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                  active ? "bg-gold-50 text-gold-700 font-medium" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" /> {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
