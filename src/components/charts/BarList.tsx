import type { CountEntry } from "@/lib/stats";

const ACCENTS = {
  pink: "from-neon-pink/80 to-neon-pink/40",
  violet: "from-neon-violet/80 to-neon-violet/40",
  blue: "from-neon-blue/80 to-neon-blue/40",
  cyan: "from-neon-cyan/80 to-neon-cyan/40",
} as const;

/** 横棒グラフ（ランキング表示用） */
export function BarList({
  entries,
  accent = "pink",
  unit = "回",
  emptyText = "データがありません。",
}: {
  entries: CountEntry[];
  accent?: keyof typeof ACCENTS;
  unit?: string;
  emptyText?: string;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-faint">{emptyText}</p>;
  }

  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <ol className="space-y-2">
      {entries.map((entry, index) => (
        <li key={entry.key}>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="w-5 shrink-0 text-[0.65rem] font-black text-faint">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{entry.label}</span>
            <span className="shrink-0 text-xs text-muted">
              <span className="font-black text-text">{entry.count}</span> {unit}
            </span>
          </div>
          <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${ACCENTS[accent]}`}
              style={{ width: `${(entry.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
