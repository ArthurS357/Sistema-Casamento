"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Wallet, Users, Armchair, BarChart3, Settings, LogOut, Menu, X, Heart, Gift, ListChecks, Lock, Sparkles, LineChart, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/lib/use-plan";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  premium?: boolean;
  /** Exclusivo do plano Gestor (ex.: Dashboard Analítico). */
  manager?: boolean;
}

const globalNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  /** Recolhe a barra para mostrar só ícones (desktop). */
  collapsed?: boolean;
  /** Alterna o estado de colapso (controlado pelo AppShell). */
  onToggleCollapse?: () => void;
  /** Abre o chat global da Lia (estado mora no AppShell). */
  onOpenLia?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse, onOpenLia }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const { isPremium, plan } = useActivePlan();
  const weddingMatch = pathname.match(/^\/weddings\/([^/]+)/);
  const weddingId = weddingMatch?.[1];

  // Free trava badge nas features premium; null (carregando) não trava.
  const locked = isPremium === false;
  // Gestor destrava o Dashboard Analítico; demais planos veem o badge.
  const isManager = plan === "gestor";
  // Gate estrito do Painel Admin: só renderiza para systemRole === "admin".
  const isAdmin = session?.user?.systemRole === "admin";

  const weddingNav: NavItem[] = weddingId
    ? [
        { href: `/weddings/${weddingId}`, label: "Visão geral", icon: Heart },
        { href: `/weddings/${weddingId}/tasks`, label: "Checklist", icon: ListChecks },
        { href: `/weddings/${weddingId}/budget`, label: "Orçamento", icon: Wallet },
        { href: `/weddings/${weddingId}/guests`, label: "Convidados", icon: Users },
        { href: `/weddings/${weddingId}/tables`, label: "Mesas", icon: Armchair, premium: true },
        { href: `/weddings/${weddingId}/gifts`, label: "Presentes", icon: Gift, premium: true },
        { href: `/weddings/${weddingId}/reports`, label: "Relatórios", icon: BarChart3 },
        { href: `/weddings/${weddingId}/analytics`, label: "Analítico", icon: LineChart, manager: true },
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
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-[transform,width] duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-16",
        )}
      >
        <div
          className={cn(
            "border-b border-slate-100",
            collapsed ? "flex flex-col items-center gap-2 p-3" : "flex items-center justify-between p-5",
          )}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-display text-xl"
            aria-label="Felice — Dashboard"
          >
            <Image src="/android-chrome-192x192.png" alt="Felice Logo" width={28} height={28} className="h-7 w-auto object-contain" priority />
            {!collapsed && "Felice"}
          </Link>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className="hidden lg:inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          <Section title="Geral" items={globalNav} pathname={pathname} locked={locked} isManager={isManager} collapsed={collapsed}>
            <LiaTeaser plan={plan} collapsed={collapsed} onClick={() => onOpenLia?.()} />
            {isAdmin && <AdminLink pathname={pathname} collapsed={collapsed} />}
          </Section>
          {weddingNav.length > 0 && <Section title="Casamento" items={weddingNav} pathname={pathname} locked={locked} isManager={isManager} collapsed={collapsed} />}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sair"
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700",
              collapsed && "justify-center px-2",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>
    </>
  );
}

/**
 * Nível de acesso à Lia por plano (teaser):
 * Gestor → ilimitado, Pro → básico, Free → bloqueado (upgrade).
 */
function liaTier(plan: string | undefined): { label: string; badge: string; badgeClass: string } {
  if (plan === "gestor") {
    return {
      label: "Lia (IA) — Acesso Ilimitado ✨",
      badge: "Gestor",
      badgeClass: "bg-slate-900 text-gold-300",
    };
  }
  if (plan === "pro") {
    return {
      label: "Lia (IA) — Acesso Básico",
      badge: "Pro",
      badgeClass: "bg-gold-100 text-gold-700",
    };
  }
  return { label: "Lia (IA) ✨", badge: "Pro", badgeClass: "bg-gold-100 text-gold-700" };
}

function LiaTeaser({ plan, collapsed, onClick }: { plan: string | undefined; collapsed: boolean; onClick: () => void }) {
  const tier = liaTier(plan);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={tier.label}
        title={collapsed ? tier.label : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50",
          collapsed && "justify-center px-2",
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-gold-500" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{tier.label}</span>
            <span className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              tier.badgeClass,
            )}>
              {tier.badge}
            </span>
          </>
        )}
      </button>
    </li>
  );
}

/** Link para o Backoffice — só montado quando o usuário é admin. */
function AdminLink({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  const active = pathname === "/admin" || pathname.startsWith("/admin");
  return (
    <li>
      <Link
        href="/admin"
        aria-label="Painel Admin"
        title={collapsed ? "Painel Admin" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          collapsed && "justify-center px-2",
          active ? "bg-gold-50 text-gold-700 font-medium" : "text-slate-600 hover:bg-slate-50",
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1">Painel Admin</span>}
      </Link>
    </li>
  );
}

function Section({
  title, items, pathname, locked, isManager, collapsed, children,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  locked: boolean;
  isManager: boolean;
  collapsed: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      {!collapsed && <p className="px-3 mb-1 text-xs uppercase tracking-wider text-slate-400">{title}</p>}
      <ul className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
          const Icon = it.icon;
          const showLock = locked && it.premium;
          const showManager = it.manager && !isManager;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-label={it.label}
                title={collapsed ? it.label : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  collapsed && "justify-center px-2",
                  active ? "bg-gold-50 text-gold-700 font-medium" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1">{it.label}</span>}
                {!collapsed && (showManager ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gold-300">
                    <Lock className="h-2.5 w-2.5" /> GESTOR
                  </span>
                ) : showLock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gold-300">
                    <Lock className="h-2.5 w-2.5" /> PRO
                  </span>
                ) : null)}
              </Link>
            </li>
          );
        })}
        {children}
      </ul>
    </div>
  );
}
