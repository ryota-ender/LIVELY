import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { APP_SCROLL_ID } from "@/components/Modal";
import { BottomNav } from "@/components/NavTabs";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    /*
     * 画面の高さぴったりのシェルにして、スクロールは中央の領域だけに閉じ込める。
     * こうするとヘッダーと下部タブが常に同じ位置に留まり、
     * ページの長さやモバイルブラウザのツールバーの開閉で動かなくなる。
     */
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader userName={user.displayName} />

      <div id={APP_SCROLL_ID} className="scroll-slim flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-4 pt-5 pb-8">{children}</div>
      </div>

      <BottomNav />
    </div>
  );
}
