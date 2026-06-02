"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Wallet, Users, Armchair, BarChart3, Settings, LogOut, Menu, X, Heart, Gift, ListChecks, Lock, Sparkles, LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/lib/use-plan";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [liaOpen, setLiaOpen] = useState(false);
  const { isPremium, plan } = useActivePlan();
  const weddingMatch = pathname.match(/^\/weddings\/([^/]+)/);
  const weddingId = weddingMatch?.[1];

  // Free trava badge nas features premium; null (carregando) não trava.
  const locked = isPremium === false;
  // Gestor destrava o Dashboard Analítico; demais planos veem o badge.
  const isManager = plan === "gestor";

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
          <Section title="Geral" items={globalNav} pathname={pathname} locked={locked} isManager={isManager}>
            <LiaTeaser plan={plan} onClick={() => setLiaOpen(true)} />
          </Section>
          {weddingNav.length > 0 && <Section title="Casamento" items={weddingNav} pathname={pathname} locked={locked} isManager={isManager} />}
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

      <Dialog open={liaOpen} onOpenChange={setLiaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold-500" /> Lia — sua assistente de IA
            </DialogTitle>
            <DialogDescription>
              Em breve a Lia vai te ajudar a planejar cada detalhe do casamento: sugerir
              tarefas, organizar o orçamento e responder dúvidas em segundos. Estamos
              caprichando nos últimos retoques. ✨
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Fique de olho — avisaremos assim que ela estiver disponível.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Nível de acesso à Lia por plano (teaser):
 * Gestor → ilimitado, Pro → básico, Free → "Em breve".
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
  return { label: "Lia (IA) ✨", badge: "Em breve", badgeClass: "bg-gold-100 text-gold-700" };
}

function LiaTeaser({ plan, onClick }: { plan: string | undefined; onClick: () => void }) {
  const tier = liaTier(plan);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-gold-500" />
        <span className="flex-1 text-left">{tier.label}</span>
        <span className={cn(
          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
          tier.badgeClass,
        )}>
          {tier.badge}
        </span>
      </button>
    </li>
  );
}

function Section({
  title, items, pathname, locked, isManager, children,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  locked: boolean;
  isManager: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-3 mb-1 text-xs uppercase tracking-wider text-slate-400">{title}</p>
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
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                  active ? "bg-gold-50 text-gold-700 font-medium" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{it.label}</span>
                {showManager ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gold-300">
                    <Lock className="h-2.5 w-2.5" /> GESTOR
                  </span>
                ) : showLock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gold-300">
                    <Lock className="h-2.5 w-2.5" /> PRO
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        {children}
      </ul>
    </div>
  );
}
