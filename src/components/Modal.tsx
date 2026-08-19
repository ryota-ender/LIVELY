"use client";

import { useEffect, type ReactNode } from "react";

import { CloseIcon } from "./icons";

/**
 * スクロールする領域の id。
 * ページ全体ではなくこの要素がスクロールするので、
 * モーダルを開いている間はここのスクロールを止める。
 */
export const APP_SCROLL_ID = "app-scroll";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const scroller = document.getElementById(APP_SCROLL_ID) ?? document.body;
    const previousOverflow = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      scroller.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:max-h-[86dvh] sm:rounded-2xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-3.5">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="ml-auto rounded-lg p-1.5 text-faint transition hover:bg-white/10 hover:text-text"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div
            className="flex flex-wrap items-center gap-2 border-t border-line-soft px-5 py-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
