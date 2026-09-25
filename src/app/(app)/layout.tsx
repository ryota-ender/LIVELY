import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/NavTabs";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader userName={user.displayName} />
      {/*
       * 内容が短いページ（ライブ詳細など）でもスクロールできる高さを確保する。
       * スクロールできないとモバイルブラウザがツールバーを畳まず、
       * 下部タブだけ一覧ページより高い位置に出てしまうため。
       */}
      <div className="mx-auto min-h-svh w-full max-w-5xl flex-1 px-4 pt-5 pb-28 sm:pb-12">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
