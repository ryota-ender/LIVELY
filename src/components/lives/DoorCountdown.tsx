"use client";

import { useSyncExternalStore } from "react";

import { todayInTokyo } from "@/lib/format";
import { getNowServerSnapshot, getNowSnapshot, subscribeNow } from "@/lib/now";

/** 開演から何時間まで「開演中」を出すか */
const LIVE_WINDOW_MS = 5 * 60 * 60 * 1000;

/** 会場は日本国内なので、日付と時刻は日本時間として解釈する */
function jstInstant(date: string, time: string): number {
  return new Date(`${date}T${time.slice(0, 8)}+09:00`).getTime();
}

function formatRemaining(ms: number): string {
  const total = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function Pill({
  label,
  value,
  tone,
}: {
  label?: string;
  value: string;
  tone: "open" | "start" | "onstage";
}) {
  const toneClass = {
    open: "border-neon-blue/40 bg-neon-blue/10 text-neon-blue",
    start: "border-today/50 bg-today/15 text-today",
    onstage: "border-neon-pink/50 bg-neon-pink/15 text-neon-pink",
  }[tone];

  return (
    <span
      role="timer"
      className={`inline-flex items-baseline gap-1.5 rounded-full border px-2.5 py-1 ${toneClass}`}
    >
      {label ? <span className="text-[0.65rem] font-semibold opacity-80">{label}</span> : null}
      <span className="font-mono text-sm font-black tabular-nums">{value}</span>
    </span>
  );
}

/**
 * 当日だけ表示するカウントダウン。
 * 開場前は開場まで、開場後は開演までを 1 秒ごとに数える。
 */
export function DoorCountdown({
  liveDate,
  openTime,
  startTime,
}: {
  liveDate: string;
  openTime: string | null;
  startTime: string | null;
}) {
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getNowServerSnapshot);

  // サーバー描画時は時刻を持たないので何も出さない
  if (now === null) return null;
  // 当日以外は出さない
  if (liveDate !== todayInTokyo()) return null;

  const openAt = openTime ? jstInstant(liveDate, openTime) : null;
  const startAt = startTime ? jstInstant(liveDate, startTime) : null;

  if (openAt !== null && now < openAt) {
    return <Pill label="開場まで" value={formatRemaining(openAt - now)} tone="open" />;
  }

  if (startAt !== null && now < startAt) {
    return <Pill label="開演まで" value={formatRemaining(startAt - now)} tone="start" />;
  }

  if (startAt !== null && now < startAt + LIVE_WINDOW_MS) {
    return <Pill value="開演中！" tone="onstage" />;
  }

  return null;
}
