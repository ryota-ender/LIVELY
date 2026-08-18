import type { CountEntry } from "@/lib/stats";

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
      <div className="flex min-w-full items-end gap-2" style={{ height: "9rem" }}>
        {entries.map((entry) => (
          <div key={entry.key} className="flex min-w-9 flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[0.65rem] font-black text-muted">
              {entry.count > 0 ? entry.count : ""}
            </span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-neon-violet/30 via-neon-violet/70 to-neon-pink"
              style={{ height: `${Math.max((entry.count / max) * 100, entry.count > 0 ? 4 : 1)}%` }}
              title={`${entry.label}: ${entry.count} 回`}
            />
            <span className="mt-1.5 text-[0.6rem] whitespace-nowrap text-faint">{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
