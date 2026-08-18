"use client";

import { useEffect } from "react";

/**
 * 想定外のエラーを拾って、真っ白な 500 画面にしないための境界。
 * 本番では Next.js がエラー内容を伏せるため、Vercel のログと突き合わせられるよう
 * digest を画面に出しておく。
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="py-10">
      <div className="panel p-6">
        <p className="text-xs font-bold text-today">エラー</p>
        <h1 className="mt-1 text-lg font-black">画面を表示できませんでした</h1>
        <p className="mt-3 text-sm text-muted">
          しばらく待ってから再試行してください。何度も起きる場合は、Supabase の設定
          （テーブル・ポリシー・環境変数）を確認してください。
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-faint">
            エラー ID:{" "}
            <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[0.7rem]">
              {error.digest}
            </code>
            <br />
            Vercel の Logs でこの ID を検索すると、詳しい原因が確認できます。
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            再試行
          </button>
          <a href="/lives" className="btn btn-ghost">
            ライブ一覧へ
          </a>
        </div>
      </div>
    </main>
  );
}
