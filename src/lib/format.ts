import type { LiveStatus } from "./types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** Asia/Tokyo の「今日」を YYYY-MM-DD で返す */
export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "YYYY-MM-DD" を { y, m, d } に分解する（タイムゾーンの影響を受けない） */
export function parseDateParts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** "2026-08-18" → "2026年8月18日(火)" */
export function formatDate(date: string): string {
  if (!date) return "";
  const { y, m, d } = parseDateParts(date);
  const w = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日(${w})`;
}

/** "2026-08-18" → "8/18(火)" */
export function formatDateShort(date: string): string {
  if (!date) return "";
  const { y, m, d } = parseDateParts(date);
  const w = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}/${d}(${w})`;
}

/** "18:00:00" → "18:00"（null や空文字は "--:--"） */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "--:--";
  return time.slice(0, 5);
}

/** input[type=time] の value 用。"18:00:00" → "18:00" */
export function toTimeInputValue(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/** 日付の差分（日数）。負なら過去。 */
export function daysBetween(from: string, to: string): number {
  const a = parseDateParts(from);
  const b = parseDateParts(to);
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86_400_000);
}

export function liveStatus(date: string, today: string): LiveStatus {
  if (date > today) return "upcoming";
  if (date === today) return "today";
  return "past";
}

export const STATUS_LABELS: Record<LiveStatus, string> = {
  upcoming: "参戦予定",
  today: "本日",
  past: "参戦済み",
};

/** ステータスごとのバッジ用クラス */
export const STATUS_BADGE_CLASS: Record<LiveStatus, string> = {
  upcoming: "bg-neon-blue/15 text-neon-blue ring-1 ring-neon-blue/40",
  today: "bg-today/20 text-today ring-1 ring-today/50",
  past: "bg-white/5 text-muted ring-1 ring-line",
};

/** Google マップの検索 URL */
export function mapUrl(venue: string | null | undefined, prefName?: string): string | null {
  const q = [prefName, venue].filter(Boolean).join(" ").trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
