import { liveStatus } from "./format";
import type { Live } from "./types";

export const SHARE_IMAGE_SIZE = { width: 1080, height: 1350 };

export type ShareScope = "past" | "upcoming";

export type SharePeriod = {
  scope: ShareScope;
  /** YYYY */
  year: string;
  /** 1〜12。未指定なら年単位 */
  month: string | null;
};

export function parseSharePeriod(
  params: URLSearchParams,
  fallbackYear: string,
): SharePeriod {
  const scope = params.get("scope") === "upcoming" ? "upcoming" : "past";
  const year = /^\d{4}$/.test(params.get("year") ?? "") ? params.get("year")! : fallbackYear;
  const rawMonth = params.get("month") ?? "";
  const month = /^(1[0-2]|[1-9])$/.test(rawMonth) ? rawMonth : null;

  return { scope, year, month };
}

export function periodLabel(period: SharePeriod): string {
  return period.month ? `${period.year}年 ${period.month}月` : `${period.year}年`;
}

export function scopeLabel(scope: ShareScope): string {
  return scope === "past" ? "参戦履歴" : "参戦予定";
}

/** 期間と過去 / 未来で絞り込み、開催日の古い順に並べる */
export function selectForShare(lives: Live[], period: SharePeriod, today: string): Live[] {
  const monthPrefix = period.month
    ? `${period.year}-${period.month.padStart(2, "0")}`
    : period.year;

  return lives
    .filter((live) => {
      if (!live.live_date.startsWith(monthPrefix)) return false;
      const status = liveStatus(live.live_date, today);
      return period.scope === "past" ? status !== "upcoming" : status === "upcoming";
    })
    .sort((a, b) => a.live_date.localeCompare(b.live_date));
}

/** 画像に載せる 1 行分 */
export type ShareRow = { date: string; artist: string; place: string };

export function toShareRows(lives: Live[], prefectureName: (code: string | null) => string) {
  return lives.map((live) => {
    const [, m, d] = live.live_date.split("-");
    const pref = prefectureName(live.prefecture_code);
    const place = [pref, live.venue].filter(Boolean).join(" ");
    return {
      date: `${Number(m)}/${Number(d)}`,
      artist: live.artist_name,
      place: place || "会場未設定",
    };
  });
}
