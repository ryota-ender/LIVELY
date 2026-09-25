import { allArtistsOf } from "./filters";
import { parseSetlist, titleKey, type Song } from "./songs";
import type { Live } from "./types";

/** ライブで聴いた曲 1 曲分の集計 */
export type HeardSong = {
  artist: string;
  /** カタログにあればカタログの曲名、無ければセトリに書いた曲名 */
  title: string;
  titleKey: string;
  /** 聴いた回数（参戦済みのライブのセトリに出た回数） */
  count: number;
  firstDate: string;
  lastDate: string;
  /** 全曲カタログに載っている曲か（未発表曲・カバーなどは false） */
  inCatalog: boolean;
  /** カタログの情報（ジャケット・Apple Music へのリンク） */
  song: Song | null;
};

/**
 * 参戦済みのライブのセトリから、聴いた曲を数える。
 *
 * セトリの曲がどのアーティストの曲かは、そのライブのメイン・共演アーティストの
 * カタログと照らして決める（対バンやフェスで共演者の曲が混ざっても正しく振り分ける）。
 * どのカタログにも無い曲はメインアーティストの曲として数える。
 */
export function collectHeardSongs(lives: Live[], songs: Song[], today: string): HeardSong[] {
  // アーティスト → 正規化した曲名 → カタログの曲
  const catalog = new Map<string, Map<string, Song>>();
  for (const song of songs) {
    let byKey = catalog.get(song.artist_name);
    if (!byKey) {
      byKey = new Map();
      catalog.set(song.artist_name, byKey);
    }
    byKey.set(song.title_key, song);
  }

  const heard = new Map<string, HeardSong>();

  for (const live of lives) {
    if (live.live_date > today) continue; // まだ参戦していないライブは数えない

    const artists = allArtistsOf(live);
    // 同じライブで同じ曲を 2 回やっても（アンコールなど）1 回として数える
    const seenInLive = new Set<string>();

    for (const line of parseSetlist(live.setlist)) {
      const key = titleKey(line);
      if (!key) continue;

      const owner = artists.find((a) => catalog.get(a)?.has(key)) ?? live.artist_name;
      const song = catalog.get(owner)?.get(key) ?? null;
      const id = `${owner}\u0000${key}`;
      if (seenInLive.has(id)) continue;
      seenInLive.add(id);

      const entry = heard.get(id);
      if (entry) {
        entry.count += 1;
        if (live.live_date < entry.firstDate) entry.firstDate = live.live_date;
        if (live.live_date > entry.lastDate) entry.lastDate = live.live_date;
      } else {
        heard.set(id, {
          artist: owner,
          title: song?.title ?? line,
          titleKey: key,
          count: 1,
          firstDate: live.live_date,
          lastDate: live.live_date,
          inCatalog: song !== null,
          song,
        });
      }
    }
  }

  return [...heard.values()].sort(
    (a, b) =>
      b.count - a.count ||
      a.firstDate.localeCompare(b.firstDate) ||
      a.title.localeCompare(b.title, "ja"),
  );
}

/** コンプリートブックの 1 行 */
export type BookEntry = {
  song: Song;
  heard: HeardSong | null;
};

export type CompleteBook = {
  artist: string;
  entries: BookEntry[];
  /** 聴いたがカタログに無い曲（未発表曲・カバー・表記が大きく違う曲） */
  extras: HeardSong[];
  heardCount: number;
  total: number;
  /** 0〜1 */
  rate: number;
};

/** アーティストの全曲のうち、どれを聴いたかをまとめる */
export function buildCompleteBook(artist: string, songs: Song[], heard: HeardSong[]): CompleteBook {
  const catalog = songs.filter((s) => s.artist_name === artist);
  const mine = heard.filter((h) => h.artist === artist);
  const heardByKey = new Map(mine.map((h) => [h.titleKey, h]));

  const entries = catalog
    .map((song) => ({ song, heard: heardByKey.get(song.title_key) ?? null }))
    .sort(
      (a, b) =>
        (a.song.release_date ?? "").localeCompare(b.song.release_date ?? "") ||
        a.song.title.localeCompare(b.song.title, "ja"),
    );

  const heardCount = entries.filter((e) => e.heard).length;
  const catalogKeys = new Set(catalog.map((s) => s.title_key));

  return {
    artist,
    entries,
    extras: mine.filter((h) => !catalogKeys.has(h.titleKey)),
    heardCount,
    total: catalog.length,
    rate: catalog.length === 0 ? 0 : heardCount / catalog.length,
  };
}
