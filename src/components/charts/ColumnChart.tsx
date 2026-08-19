import type { CountEntry } from "@/lib/stats";

/** バーを描く領域の高さ。パーセント指定が解決されるよう、必ず確定値を持たせる */
const BAR_AREA_HEIGHT = "8rem";
/** 最大値のバーでも数値ラベルの分だけ上を空ける */
const BAR_MAX_PERCENT = 88;

/** 縦棒グラフ（年別・月別など） */
export function ColumnChart({
  entries,
  emptyText = "データがありません。",
}: {
  entries: CountEntry[];
  emptyText?: string;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">{emptyText}</p>;
  }

  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="scroll-slim overflow-x-auto">
      <div className="flex min-w-full gap-2">
        {entries.map((entry) => {
          // 1 回でも参戦していれば見えるように下限を設ける
          const percent = Math.max((entry.count / max) * BAR_MAX_PERCENT, 3);

          return (
            <div key={entry.key} className="flex min-w-9 flex-1 flex-col items-center">
              <div
                className="relative flex w-full items-end"
                style={{ height: BAR_AREA_HEIGHT }}
                title={`${entry.label}: ${entry.count} 回`}
              >
                {entry.count > 0 ? (
                  <>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-neon-violet/30 via-neon-violet/70 to-neon-pink"
                      style={{ height: `${percent}%` }}
                    />
                    <span
                      className="absolute inset-x-0 text-center text-[0.65rem] font-black text-muted"
                      style={{ bottom: `calc(${percent}% + 0.25rem)` }}
                    >
                      {entry.count}
                    </span>
                  </>
                ) : (
                  // 0 件の月も、目盛りとして薄い線を残す
                  <div className="h-0.5 w-full rounded-full bg-white/10" />
                )}
              </div>

              <span className="mt-1.5 text-[0.6rem] whitespace-nowrap text-faint">
                {entry.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
