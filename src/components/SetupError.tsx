import type { LoadResult } from "@/lib/lives";

type Failure = Extract<LoadResult<unknown>, { ok: false }>;

/** Postgres / PostgREST のエラーコードから、原因と対処法を推定する */
function diagnose(error: Failure): { title: string; steps: string[] } {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  // テーブルが存在しない
  if (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  ) {
    return {
      title: "lives テーブルがまだ作られていません",
      steps: [
        "Supabase ダッシュボードを開き、左メニューの「SQL Editor」を選ぶ",
        "リポジトリの supabase/schema.sql の中身をすべてコピーして貼り付ける",
        "「Run」を押して、エラーが出ずに完了することを確認する",
        "この画面を再読み込みする",
      ],
    };
  }

  // 権限不足（RLS が有効なのにポリシーが無い、など）
  if (code === "42501" || message.includes("row-level security") || message.includes("permission")) {
    return {
      title: "テーブルへのアクセス権限がありません",
      steps: [
        "supabase/schema.sql の「行レベルセキュリティ」の部分がすべて実行できているか確認する",
        "SQL Editor で select policyname, cmd from pg_policies where tablename='lives'; を実行し、4 行（SELECT / INSERT / UPDATE / DELETE）返ることを確認する",
        "足りない場合は schema.sql を再度実行する（何度実行しても問題ありません）",
      ],
    };
  }

  return {
    title: "データベースへの接続でエラーが発生しました",
    steps: [
      "Supabase のプロジェクトが一時停止（Paused）していないか確認する",
      "Vercel の環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が正しいか確認する",
      "supabase/schema.sql を SQL Editor で実行する",
    ],
  };
}

/** DB の準備が終わっていないときに、原因と次にやることを画面に出す */
export function SetupError({ error }: { error: Failure }) {
  const { title, steps } = diagnose(error);

  return (
    <div className="panel border-today/40 p-5">
      <p className="text-xs font-bold text-today">セットアップが完了していません</p>
      <h2 className="mt-1 text-lg font-black">{title}</h2>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.65rem] font-black">
              {index + 1}
            </span>
            <span className="text-muted">{step}</span>
          </li>
        ))}
      </ol>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-faint">エラーの詳細</summary>
        <pre className="scroll-slim mt-2 overflow-x-auto rounded-lg bg-ink/60 p-3 font-mono text-[0.7rem] whitespace-pre-wrap text-muted">
          {error.code ? `code: ${error.code}\n` : ""}
          {`message: ${error.message}`}
          {error.hint ? `\nhint: ${error.hint}` : ""}
        </pre>
      </details>
    </div>
  );
}
