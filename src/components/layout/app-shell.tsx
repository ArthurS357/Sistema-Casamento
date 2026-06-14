"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { HelpFab } from "@/components/layout/help-fab";
import { LiaChatFab } from "@/components/lia/lia-chat-fab";
import { cn } from "@/lib/utils";

/**
 * Casca do painel autenticado. Cliente porque detém o estado de colapso da
 * Sidebar (desktop) — quando recolhida, a margem do conteúdo acompanha a
 * largura para não deixar um vão. No mobile a Sidebar usa overlay próprio,
 * então o colapso só vale a partir de `lg`.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [liaOpen, setLiaOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onOpenLia={() => setLiaOpen(true)}
      />
      <div
        className={cn(
          "transition-[margin] duration-300 ease-in-out",
          collapsed ? "lg:ml-16" : "lg:ml-64",
        )}
      >
        <AnnouncementBanner />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
      <HelpFab />
      <LiaChatFab open={liaOpen} onOpenChange={setLiaOpen} />
    </div>
  );
}
