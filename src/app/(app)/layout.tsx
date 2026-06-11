import { getAuthenticatedUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await getAuthenticatedUser();
  return <AppShell>{children}</AppShell>;
}
