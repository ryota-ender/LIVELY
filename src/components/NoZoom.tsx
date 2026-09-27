"use client";

import { useEffect } from "react";

/**
 * iOS Safari は viewport の user-scalable=no をピンチ操作では無視する。
 * アプリとして画面が拡大されないよう、iOS 独自の gesture イベントを止める。
 * （入力時の自動拡大とダブルタップ拡大は viewport と CSS 側で止めている）
 */
export function NoZoom() {
  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener("gesturestart", prevent, options);
    document.addEventListener("gesturechange", prevent, options);
    return () => {
      document.removeEventListener("gesturestart", prevent, options);
      document.removeEventListener("gesturechange", prevent, options);
    };
  }, []);

  return null;
}
