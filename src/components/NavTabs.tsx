"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/lives", label: "ライブ", icon: "🎫" },
  { href: "/map", label: "制覇マップ", icon: "🗾" },
  { href: "/stats", label: "統計", icon: "📊" },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** ヘッダー内のタブ（タブレット以上で表示） */
export function NavTabs() {
  const isActive = useIsActive();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? "bg-white/10 text-text ring-1 ring-neon-violet/50"
                : "text-muted hover:bg-white/5 hover:text-text"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** スマホ用の下部タブバー */
export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-ink/85 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-semibold transition ${
                  active ? "text-neon-pink" : "text-faint"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
