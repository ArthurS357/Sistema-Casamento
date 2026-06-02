"use client";
import { BarChart3, Users, ScrollText, Megaphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetricsTab } from "@/components/admin/metrics-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { AuditTab } from "@/components/admin/audit-tab";
import { AnnouncementsTab } from "@/components/admin/announcements-tab";

export function AdminBackoffice() {
  return (
    <Tabs defaultValue="metrics" className="space-y-2">
      <TabsList className="flex-wrap">
        <TabsTrigger value="metrics">
          <BarChart3 className="h-4 w-4" /> Métricas
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="h-4 w-4" /> Usuários
        </TabsTrigger>
        <TabsTrigger value="audit">
          <ScrollText className="h-4 w-4" /> Auditoria
        </TabsTrigger>
        <TabsTrigger value="announcements">
          <Megaphone className="h-4 w-4" /> Anúncios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="metrics">
        <MetricsTab />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab />
      </TabsContent>
      <TabsContent value="audit">
        <AuditTab />
      </TabsContent>
      <TabsContent value="announcements">
        <AnnouncementsTab />
      </TabsContent>
    </Tabs>
  );
}
