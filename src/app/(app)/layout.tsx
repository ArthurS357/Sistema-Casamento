import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:ml-64">
        <AnnouncementBanner />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
