import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { supabaseEnv } from "@/lib/env";
import { getProfile } from "@/services/catalog";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseEnv()) redirect("/login");
  const profile = await getProfile();

  return (
    <AppShell email={profile.email} name={profile.displayName}>
      {children}
    </AppShell>
  );
}
