import { liveStatus } from "./format";
import type { Live } from "./types";

/** 画像の横幅。高さは件数に応じて伸びる（app/share/render.tsx で計算） */
export const SHARE_IMAGE_WIDTH = 1080;

export type ShareScope = "past" | "upcoming";

export type SharePeriod = {
  scope: ShareScope;
  /** YYYY */
  year: string;
  /** 開始月 1〜12。null なら 1 年分 */
  fromMonth: number | null;
  /** 終了月 1〜12。fromMonth と同じなら 1 か月分 */
  toMonth: number | null;
};

function parseMonth(value: string | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

export function parseSharePeriod(params: URLSearchParams, fallbackYear: string): SharePeriod {
  const scope = params.get("scope") === "upcoming" ? "upcoming" : "past";
  const rawYear = params.get("year") ?? "";
  const year = /^\d{4}$/.test(rawYear) ? rawYear : fallbackYear;

  const from = parseMonth(params.get("from"));
  // 開始月の指定がなければ 1 年分。終了月だけ抜けていたら 1 か月分として扱う
  const to = from === null ? null : Math.max(parseMonth(params.get("to")) ?? from, from);

  return { scope, year, fromMonth: from, toMonth: to };
}

export function periodLabel(period: SharePeriod): string {
  const { year, fromMonth, toMonth } = period;
  if (fromMonth === null) return `${year}年`;
  if (toMonth === null || toMonth === fromMonth) return `${year}年 ${fromMonth}月`;
  return `${year}年 ${fromMonth}〜${toMonth}月`;
}

export function scopeLabel(scope: ShareScope): string {
  return scope === "past" ? "参戦履歴" : "参戦予定";
}

/** 期間と過去 / 未来の条件に合うか */
export function matchesSharePeriod(date: string, isPast: boolean, period: SharePeriod): boolean {
  const { year, fromMonth, toMonth } = period;

  if (!date.startsWith(`${year}-`)) return false;

  if (fromMonth !== null) {
    const month = Number(date.slice(5, 7));
    if (month < fromMonth || month > (toMonth ?? fromMonth)) return false;
  }

  return period.scope === "past" ? isPast : !isPast;
}

/** 期間と過去 / 未来で絞り込み、開催日の古い順に並べる */
export function selectForShare(lives: Live[], period: SharePeriod, today: string): Live[] {
  return lives
    .filter((live) =>
      matchesSharePeriod(live.live_date, liveStatus(live.live_date, today) === "past", period),
    )
    .sort((a, b) => a.live_date.localeCompare(b.live_date));
}

/** 画面側で件数を数えるための最小限の一覧 */
export type ShareIndexEntry = { date: string; past: boolean };

export function countForShare(index: ShareIndexEntry[], period: SharePeriod): number {
  return index.filter((item) => matchesSharePeriod(item.date, item.past, period)).length;
}

/**
 * この件数を超えたら画像を 2 枚に分ける。
 * 1 枚が縦に長くなりすぎると SNS で縮小されて読めなくなるため。
 */
export const SPLIT_THRESHOLD = 60;

/** 何枚に分けるか */
export function sharePageCount(total: number): number {
  return total > SPLIT_THRESHOLD ? 2 : 1;
}

/**
 * 指定ページ分を切り出す。
 * 2 枚に分けるときはちょうど半々にし、奇数なら 1 枚目を 1 件多くする。
 */
export function sliceForPage<T>(items: T[], page: number): T[] {
  if (sharePageCount(items.length) === 1) return items;

  const first = Math.ceil(items.length / 2);
  return page >= 2 ? items.slice(first) : items.slice(0, first);
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
