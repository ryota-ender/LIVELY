import type { ReactNode } from "react";

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
