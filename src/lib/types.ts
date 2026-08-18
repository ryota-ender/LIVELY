export const LIVE_TYPES = ["oneman", "taiban", "fes"] as const;

export type LiveType = (typeof LIVE_TYPES)[number];

export const LIVE_TYPE_LABELS: Record<LiveType, string> = {
  oneman: "ワンマン",
  taiban: "対バン",
  fes: "フェス",
};

export function isLiveType(value: unknown): value is LiveType {
  return typeof value === "string" && (LIVE_TYPES as readonly string[]).includes(value);
}

/** lives テーブルの 1 行 */
export type Live = {
  id: string;
  user_id: string;
  artist_name: string;
  co_artists: string[];
  live_title: string;
  /** YYYY-MM-DD */
  live_date: string;
  /** HH:MM:SS */
  open_time: string | null;
  /** HH:MM:SS */
  start_time: string | null;
  venue: string | null;
  /** JIS 都道府県コード（"01"〜"47"） */
  prefecture_code: string | null;
  live_type: LiveType | null;
  memo: string | null;
  setlist: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

/** 画像の署名付き URL を付与したライブ */
export type LiveWithImage = Live & { image_url: string | null };

/** 開催ステータス */
export type LiveStatus = "upcoming" | "today" | "past";

export type ActionResult = { ok: true } | { ok: false; message: string };
