import "server-only";

import { IMAGE_BUCKET, SIGNED_URL_TTL } from "./storage";
import { createClient } from "./supabase/server";
import type { Live, LiveWithImage } from "./types";

const SELECT_COLUMNS =
  "id, user_id, artist_name, co_artists, live_title, live_date, open_time, start_time, venue, prefecture_code, live_type, memo, setlist, image_path, created_at, updated_at";

/**
 * 読み込み結果。DB 側の準備ができていないケース（テーブル未作成など）は
 * 例外にせず結果として返し、画面に原因と対処法を出せるようにする。
 * （本番の Next.js は投げた例外の内容を伏せてしまい、原因が分からなくなるため）
 */
export type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code: string | null; hint: string | null };

/**
 * ログインユーザーのライブ記録をすべて取得する（新しい順）。
 * 絞り込み・並び替え・集計は取得後にアプリ側で行う（1 ユーザーあたりの件数は多くないため、
 * 一覧・統計・マップで同じデータを使い回せるほうが速い）。
 */
export async function loadLives(): Promise<LoadResult<Live[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lives")
    .select(SELECT_COLUMNS)
    .order("live_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false });

  if (error) {
    return {
      ok: false,
      message: error.message,
      code: error.code ?? null,
      hint: error.hint ?? null,
    };
  }

  return { ok: true, data: (data ?? []).map(normalize) };
}

/** 一覧で使う読み込み（画像の署名付き URL 付き） */
export async function loadLivesWithImages(): Promise<LoadResult<LiveWithImage[]>> {
  const result = await loadLives();
  if (!result.ok) return result;
  return { ok: true, data: await withImageUrls(result.data) };
}

/** 1 件だけ取得する（見つからなければ data が null） */
export async function loadLive(id: string): Promise<LoadResult<LiveWithImage | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lives")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
      code: error.code ?? null,
      hint: error.hint ?? null,
    };
  }

  if (!data) return { ok: true, data: null };

  const [live] = await withImageUrls([normalize(data)]);
  return { ok: true, data: live };
}

/** 画像パスを署名付き URL に変換して付与する */
export async function withImageUrls(lives: Live[]): Promise<LiveWithImage[]> {
  const paths = [...new Set(lives.map((l) => l.image_path).filter((p): p is string => Boolean(p)))];

  if (paths.length === 0) {
    return lives.map((live) => ({ ...live, image_url: null }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  const urlByPath = new Map<string, string>();
  if (!error && data) {
    for (const item of data) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    }
  }

  return lives.map((live) => ({
    ...live,
    image_url: live.image_path ? (urlByPath.get(live.image_path) ?? null) : null,
  }));
}

type LiveRow = Omit<Live, "co_artists"> & { co_artists: string[] | null };

function normalize(row: LiveRow): Live {
  return { ...row, co_artists: row.co_artists ?? [] };
}
