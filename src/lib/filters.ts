import { liveStatus } from "./format";
import { isPrefectureCode } from "./prefectures";
import { isLiveType, type Live, type LiveType } from "./types";

export type SortKey = "asc" | "desc" | "artist";

export type LiveFilters = {
  /** アーティスト名（メイン or 共演） */
  artist: string;
  status: "" | "upcoming" | "past";
  type: "" | LiveType;
  /** YYYY */
  year: string;
  /** 1〜12（ゼロ埋めなし） */
  month: string;
  /** JIS 都道府県コード */
  prefecture: string;
  sort: SortKey;
};

export const EMPTY_FILTERS: LiveFilters = {
  artist: "",
  status: "",
  type: "",
  year: "",
  month: "",
  prefecture: "",
  sort: "desc",
};

export type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseFilters(searchParams: SearchParams): LiveFilters {
  const status = one(searchParams.status);
  const type = one(searchParams.type);
  const year = one(searchParams.year);
  const month = one(searchParams.month);
  const prefecture = one(searchParams.pref);
  const sort = one(searchParams.sort);

  return {
    artist: one(searchParams.artist).trim(),
    status: status === "upcoming" || status === "past" ? status : "",
    type: isLiveType(type) ? type : "",
    year: /^\d{4}$/.test(year) ? year : "",
    month: /^(1[0-2]|[1-9])$/.test(month) ? month : "",
    prefecture: isPrefectureCode(prefecture) ? prefecture : "",
    sort: sort === "asc" || sort === "desc" || sort === "artist" ? sort : "desc",
  };
}

/** フィルタを URL のクエリ文字列にする（既定値は省略） */
export function buildQuery(filters: Partial<LiveFilters>): string {
  const params = new URLSearchParams();
  if (filters.artist) params.set("artist", filters.artist);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.year) params.set("year", filters.year);
  if (filters.month) params.set("month", filters.month);
  if (filters.prefecture) params.set("pref", filters.prefecture);
  if (filters.sort && filters.sort !== EMPTY_FILTERS.sort) params.set("sort", filters.sort);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function hasActiveFilters(filters: LiveFilters): boolean {
  return Boolean(
    filters.artist ||
      filters.status ||
      filters.type ||
      filters.year ||
      filters.month ||
      filters.prefecture,
  );
}

/** そのライブに関わる全アーティスト（メイン + 共演） */
export function allArtistsOf(live: Pick<Live, "artist_name" | "co_artists">): string[] {
  return [live.artist_name, ...(live.co_artists ?? [])].map((a) => a.trim()).filter(Boolean);
}

export function applyFilters<T extends Live>(lives: T[], filters: LiveFilters, today: string): T[] {
  const filtered = lives.filter((live) => {
    if (filters.artist && !allArtistsOf(live).includes(filters.artist)) return false;

    if (filters.status) {
      const status = liveStatus(live.live_date, today);
      // 「開催前」は当日を含む（当日のライブはまだこれから）
      if (filters.status === "upcoming" && status === "past") return false;
      if (filters.status === "past" && status !== "past") return false;
    }

    if (filters.type && live.live_type !== filters.type) return false;

    if (filters.year && !live.live_date.startsWith(`${filters.year}-`)) return false;

    if (filters.month) {
      const mm = String(filters.month).padStart(2, "0");
      if (live.live_date.slice(5, 7) !== mm) return false;
    }

    if (filters.prefecture && live.prefecture_code !== filters.prefecture) return false;

    return true;
  });

  return sortLives(filtered, filters.sort);
}

export function sortLives<T extends Live>(lives: T[], sort: SortKey): T[] {
  const sorted = [...lives];
  const byDate = (a: Live, b: Live) =>
    a.live_date.localeCompare(b.live_date) ||
    (a.start_time ?? "").localeCompare(b.start_time ?? "");

  if (sort === "asc") sorted.sort(byDate);
  else if (sort === "desc") sorted.sort((a, b) => byDate(b, a));
  else
    sorted.sort(
      (a, b) => a.artist_name.localeCompare(b.artist_name, "ja") || byDate(a, b),
    );

  return sorted;
}

/** 絞り込みプルダウン用の、登録済みアーティスト一覧（重複なし・五十音順） */
export function distinctArtists(lives: Live[]): string[] {
  const set = new Set<string>();
  for (const live of lives) {
    for (const artist of allArtistsOf(live)) set.add(artist);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ja"));
}

/** 絞り込みプルダウン用の、登録済みの開催年一覧（新しい順） */
export function distinctYears(lives: Live[]): string[] {
  const set = new Set<string>();
  for (const live of lives) set.add(live.live_date.slice(0, 4));
  return [...set].sort((a, b) => b.localeCompare(a));
}
