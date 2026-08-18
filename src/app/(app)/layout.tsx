import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/NavTabs";
import { displayNameOf, getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader userName={displayNameOf(user)} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 sm:pb-12">{children}</div>
      <BottomNav />
    </>
  );
}
