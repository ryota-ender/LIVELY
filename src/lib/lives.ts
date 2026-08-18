import "server-only";

import { IMAGE_BUCKET, SIGNED_URL_TTL } from "./storage";
import { createClient } from "./supabase/server";
import type { Live, LiveWithImage } from "./types";

const SELECT_COLUMNS =
  "id, user_id, artist_name, co_artists, live_title, live_date, open_time, start_time, venue, prefecture_code, live_type, memo, setlist, image_path, created_at, updated_at";

/**
 * ログインユーザーのライブ記録をすべて取得する（新しい順）。
 * 絞り込み・並び替え・集計は取得後にアプリ側で行う（1 ユーザーあたりの件数は多くないため、
 * 一覧・統計・マップで同じデータを使い回せるほうが速い）。
 */
export async function fetchLives(): Promise<Live[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lives")
    .select(SELECT_COLUMNS)
    .order("live_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`ライブの取得に失敗しました: ${error.message}`);

  return (data ?? []).map(normalize);
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

/** 一覧・マップ・統計で使う共通の読み込み */
export async function fetchLivesWithImages(): Promise<LiveWithImage[]> {
  return withImageUrls(await fetchLives());
}

type LiveRow = Omit<Live, "co_artists"> & { co_artists: string[] | null };

function normalize(row: LiveRow): Live {
  return { ...row, co_artists: row.co_artists ?? [] };
}
