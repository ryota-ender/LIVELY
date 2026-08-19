import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/auth-actions";

import { NavTabs } from "./NavTabs";

export function AppHeader({ userName }: { userName: string }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-line-soft bg-ink/80 backdrop-blur-lg"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/lives" className="flex items-center gap-2">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={30}
            height={30}
            className="rounded-[26%] ring-1 ring-white/10"
          />
          <span className="neon-text text-lg font-black tracking-[0.22em] pl-[0.22em]">
            LIVELY
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <NavTabs />

          {userName ? (
            <span className="hidden text-xs text-muted md:inline">{userName} さん</span>
          ) : null}

          <form action={signOut}>
            <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
