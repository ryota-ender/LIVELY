import { liveStatus } from "./format";
import type { Live } from "./types";

/** 画像の横幅。高さは件数に応じて伸びる（app/share/render.tsx で計算） */
export const SHARE_IMAGE_WIDTH = 1080;

/** 期間での書き出しは過去か未来のどちらか。アーティスト・ツアーでは両方（all）も選べる */
export type ShareScope = "past" | "upcoming" | "all";

export type SharePeriod = {
  scope: ShareScope;
  /** YYYY */
  year: string;
  /** 開始月 1〜12。null なら 1 年分 */
  fromMonth: number | null;
  /** 終了月 1〜12。fromMonth と同じなら 1 か月分 */
  toMonth: number | null;
};

/** 何を書き出すか */
export type ShareTarget =
  | ({ kind: "period" } & SharePeriod)
  | { kind: "artist"; artist: string; scope: ShareScope; year: string | null }
  | { kind: "tour"; artist: string; tour: string; scope: ShareScope };

function parseMonth(value: string | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

function parseScope(value: string | null, allowAll: boolean): ShareScope {
  if (value === "upcoming") return "upcoming";
  if (value === "all" && allowAll) return "all";
  return value === "past" || !allowAll ? "past" : "all";
}

function parseYear(value: string | null): string | null {
  return value && /^\d{4}$/.test(value) ? value : null;
}

export function parseShareTarget(params: URLSearchParams, fallbackYear: string): ShareTarget {
  const mode = params.get("mode");
  const artist = (params.get("artist") ?? "").trim().slice(0, 100);

  if (mode === "artist") {
    return {
      kind: "artist",
      artist,
      scope: parseScope(params.get("scope"), true),
      year: parseYear(params.get("year")),
    };
  }
  if (mode === "tour") {
    return {
      kind: "tour",
      artist,
      tour: (params.get("tour") ?? "").trim().slice(0, 150),
      scope: parseScope(params.get("scope"), true),
    };
  }

  const from = parseMonth(params.get("from"));
  // 開始月の指定がなければ 1 年分。終了月だけ抜けていたら 1 か月分として扱う
  const to = from === null ? null : Math.max(parseMonth(params.get("to")) ?? from, from);

  return {
    kind: "period",
    scope: parseScope(params.get("scope"), false),
    year: parseYear(params.get("year")) ?? fallbackYear,
    fromMonth: from,
    toMonth: to,
  };
}

/** ShareTarget を /share の検索パラメータにする（parseShareTarget の逆） */
export function shareTargetParams(target: ShareTarget): URLSearchParams {
  const params = new URLSearchParams({ scope: target.scope });
  if (target.kind === "period") {
    params.set("year", target.year);
    if (target.fromMonth !== null) {
      params.set("from", String(target.fromMonth));
      params.set("to", String(target.toMonth ?? target.fromMonth));
    }
  } else if (target.kind === "artist") {
    params.set("mode", "artist");
    params.set("artist", target.artist);
    if (target.year) params.set("year", target.year);
  } else {
    params.set("mode", "tour");
    params.set("artist", target.artist);
    params.set("tour", target.tour);
  }
  return params;
}

export function periodLabel(period: SharePeriod): string {
  const { year, fromMonth, toMonth } = period;
  if (fromMonth === null) return `${year}年`;
  if (toMonth === null || toMonth === fromMonth) return `${year}年 ${fromMonth}月`;
  return `${year}年 ${fromMonth}〜${toMonth}月`;
}

export function scopeLabel(scope: ShareScope): string {
  if (scope === "past") return "参戦履歴";
  if (scope === "upcoming") return "参戦予定";
  return "参戦記録";
}

/** 画像の見出し */
export function shareHeading(target: ShareTarget): {
  title: string;
  subtitle: string | null;
  badge: string;
} {
  const badge = scopeLabel(target.scope);
  if (target.kind === "period") return { title: periodLabel(target), subtitle: null, badge };
  if (target.kind === "artist") {
    return { title: target.artist, subtitle: target.year ? `${target.year}年` : null, badge };
  }
  return { title: target.tour, subtitle: target.artist, badge };
}

/** 画面側で件数を数えたり、アーティスト・ツアーの候補を作るための最小限の一覧 */
export type ShareIndexEntry = {
  date: string;
  past: boolean;
  /** メイン、共演の順 */
  artists: string[];
  title: string;
};

export function toShareIndexEntry(live: Live, today: string): ShareIndexEntry {
  return {
    date: live.live_date,
    past: liveStatus(live.live_date, today) === "past",
    artists: [live.artist_name, ...live.co_artists],
    title: live.live_title.trim(),
  };
}

function matchesScope(past: boolean, scope: ShareScope): boolean {
  if (scope === "all") return true;
  return scope === "past" ? past : !past;
}

/** 書き出しの条件に合うか */
export function matchesShareTarget(entry: ShareIndexEntry, target: ShareTarget): boolean {
  if (!matchesScope(entry.past, target.scope)) return false;

  if (target.kind === "period") {
    const { year, fromMonth, toMonth } = target;
    if (!entry.date.startsWith(`${year}-`)) return false;
    if (fromMonth !== null) {
      const month = Number(entry.date.slice(5, 7));
      if (month < fromMonth || month > (toMonth ?? fromMonth)) return false;
    }
    return true;
  }

  // 対バン・フェスで共演として出たライブも、そのアーティストの記録に含める
  if (!entry.artists.includes(target.artist)) return false;
  if (target.kind === "artist") {
    return target.year === null || entry.date.startsWith(`${target.year}-`);
  }
  return entry.title === target.tour;
}

/** 条件で絞り込み、開催日の古い順に並べる */
export function selectForShare(lives: Live[], target: ShareTarget, today: string): Live[] {
  return lives
    .filter((live) => matchesShareTarget(toShareIndexEntry(live, today), target))
    .sort((a, b) => a.live_date.localeCompare(b.live_date));
}

export function countForShare(index: ShareIndexEntry[], target: ShareTarget): number {
  return index.filter((entry) => matchesShareTarget(entry, target)).length;
}

export type ShareChoice = { name: string; count: number };

/** 書き出せるアーティスト（共演を含む。本数の多い順） */
export function shareArtists(index: ShareIndexEntry[]): ShareChoice[] {
  const counts = new Map<string, number>();
  for (const entry of index) {
    for (const artist of new Set(entry.artists)) counts.set(artist, (counts.get(artist) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
}

/** そのアーティストのツアー（同じライブタイトルをまとめる。新しい順） */
export function shareTours(index: ShareIndexEntry[], artist: string): ShareChoice[] {
  const tours = new Map<string, { count: number; latest: string }>();
  for (const entry of index) {
    if (!entry.artists.includes(artist) || !entry.title) continue;
    const tour = tours.get(entry.title) ?? { count: 0, latest: "" };
    tour.count += 1;
    if (entry.date > tour.latest) tour.latest = entry.date;
    tours.set(entry.title, tour);
  }
  return [...tours]
    .sort((a, b) => b[1].latest.localeCompare(a[1].latest) || a[0].localeCompare(b[0], "ja"))
    .map(([name, { count }]) => ({ name, count }));
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

/** 画像に載せる 1 行分（main が大きい文字、sub が小さい文字） */
export type ShareRow = { date: string; main: string; sub: string };

export function toShareRows(
  lives: Live[],
  target: ShareTarget,
  prefectureName: (code: string | null) => string,
): ShareRow[] {
  // 複数の年にまたがるときだけ日付に年を付ける
  const multiYear = new Set(lives.map((live) => live.live_date.slice(0, 4))).size > 1;

  return lives.map((live) => {
    const [y, m, d] = live.live_date.split("-");
    const date = multiYear ? `${y}/${Number(m)}/${Number(d)}` : `${Number(m)}/${Number(d)}`;
    const pref = prefectureName(live.prefecture_code);
    const place = [pref, live.venue].filter(Boolean).join(" ") || "会場未設定";

    if (target.kind === "artist") return { date, main: live.live_title, sub: place };
    if (target.kind === "tour") {
      // ツアーは会場が主役。都道府県は小さく添える
      return live.venue
        ? { date, main: live.venue, sub: pref }
        : { date, main: pref || "会場未設定", sub: "" };
    }
    return { date, main: live.artist_name, sub: place };
  });
}
