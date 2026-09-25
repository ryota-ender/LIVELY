"use server";

import { revalidatePath } from "next/cache";

import { fetchItunesArtistSongs, searchItunesArtists, type ItunesArtist } from "@/lib/itunes";
import { createClient } from "@/lib/supabase/server";

export type CandidateResult = { ok: true; candidates: ItunesArtist[] } | { ok: false; message: string };

/** 取り込み元のアーティスト候補を探す（表記が英字のこともあるので本人に選んでもらう） */
export async function findArtistCandidates(name: string): Promise<CandidateResult> {
  const term = name.trim();
  if (!term) return { ok: false, message: "アーティスト名が空です。" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "ログインし直してください。" };

  try {
    return { ok: true, candidates: await searchItunesArtists(term) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "検索に失敗しました。" };
  }
}

export type ImportResult = { ok: true; count: number } | { ok: false; message: string };

/**
 * アーティストの全曲を iTunes から取り込む。
 * 取り込み直したときに、配信が終わった曲などが残らないよう古い行は消す。
 */
export async function importArtistCatalog(
  artistName: string,
  itunesArtistId: number,
): Promise<ImportResult> {
  const name = artistName.trim();
  if (!name || !Number.isSafeInteger(itunesArtistId)) {
    return { ok: false, message: "取り込み先の指定が正しくありません。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "ログインし直してください。" };

  let songs;
  try {
    songs = await fetchItunesArtistSongs(itunesArtistId);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "曲の取得に失敗しました。" };
  }
  if (songs.length === 0) {
    return { ok: false, message: "曲が見つかりませんでした。別の候補を選んでみてください。" };
  }

  const { error: upsertError } = await supabase.from("songs").upsert(
    songs.map((s) => ({
      user_id: user.id,
      artist_name: name,
      title: s.title,
      title_key: s.titleKey,
      album: s.album,
      release_date: s.releaseDate,
      artwork_url: s.artworkUrl,
      track_url: s.trackUrl,
      itunes_track_id: s.trackId,
    })),
    { onConflict: "user_id,artist_name,title_key" },
  );
  if (upsertError) return { ok: false, message: `保存に失敗しました: ${upsertError.message}` };

  // 今回の取り込みに含まれなかった曲（以前の取り込みの残り）を消す
  const keep = new Set(songs.map((s) => s.titleKey));
  const { data: existing } = await supabase
    .from("songs")
    .select("id, title_key")
    .eq("user_id", user.id)
    .eq("artist_name", name);
  const stale = (existing ?? []).filter((row) => !keep.has(row.title_key)).map((row) => row.id);
  if (stale.length > 0) {
    await supabase.from("songs").delete().in("id", stale);
  }

  // どの iTunes アーティストから取り込んだかを覚えておく（取り込み直しで使う）
  await supabase.from("artists").upsert(
    {
      user_id: user.id,
      name,
      itunes_artist_id: itunesArtistId,
      catalog_updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,name" },
  );

  revalidatePath("/songs");
  revalidatePath("/artists");
  revalidatePath("/stats");
  return { ok: true, count: songs.length };
}
