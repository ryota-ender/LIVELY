import Image from "next/image";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={84}
            height={84}
            priority
            className="rounded-[22%] shadow-[0_14px_50px_-12px_rgba(255,62,200,0.75)] ring-1 ring-white/10"
          />
          <h1 className="neon-text mt-5 text-3xl font-black tracking-[0.35em] pl-[0.35em]">
            LIVELY
          </h1>
          <p className="mt-2 text-xs text-faint">ライブ参戦記録 &amp; 都道府県制覇マップ</p>
        </div>

        <div className="panel p-6">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
