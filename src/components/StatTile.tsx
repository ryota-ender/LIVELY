import type { ReactNode } from "react";

/**
 * 数値タイル。
 *
 * accent の使い分け（画面をまたいで揃えること）:
 *   pink   … 実績（参戦回数・登録数）
 *   blue   … これから（予定）
 *   cyan   … 場所（都道府県・会場）
 *   violet … 人（アーティスト）
 */

export function StatTile({
  label,
  value,
  unit,
  hint,
  accent = "pink",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  accent?: "pink" | "blue" | "violet" | "cyan";
}) {
  const accentClass = {
    pink: "text-neon-pink",
    blue: "text-neon-blue",
    violet: "text-neon-violet",
    cyan: "text-neon-cyan",
  }[accent];

  return (
    <div className="panel px-4 py-3.5">
      <p className="text-[0.7rem] font-semibold text-faint">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl leading-none font-black ${accentClass}`}>{value}</span>
        {unit ? <span className="text-[0.7rem] text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-[0.65rem] text-faint">{hint}</p> : null}
    </div>
  );
}
