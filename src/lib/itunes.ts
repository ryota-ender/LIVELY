import "server-only";

import { titleKey } from "./songs";

/**
 * iTunes Search API（Apple）から曲データを取る。
 * API キーもログインも不要。日本のストアを指定すると日本のアーティストに強い。
 *
 * https://performance-partners.apple.com/search-api
 */
const BASE = "https://itunes.apple.com";
const STORE = { country: "JP", lang: "ja_jp" };

/** 1 回の lookup で返る件数の上限 */
const LOOKUP_LIMIT = 200;
/** アルバムの曲をまとめて引くときの 1 回あたりのアルバム数（200 件の上限に収まるように） */
const ALBUMS_PER_REQUEST = 10;
/**
 * 同時に投げる件数。iTunes は 1 分あたり 20 回ほどで制限がかかるので控えめにする
 * （1 アーティストの取り込みで 5〜10 回程度）。
 */
const CONCURRENCY = 3;

export type ItunesArtist = {
  id: number;
  name: string;
  genre: string | null;
  url: string | null;
};

export type CatalogSong = {
  title: string;
  titleKey: string;
  album: string | null;
  releaseDate: string | null;
  artworkUrl: string | null;
  trackUrl: string | null;
  trackId: number;
};

type ItunesResult = {
  wrapperType?: string;
  kind?: string;
  artistId?: number;
  artistName?: string;
  primaryGenreName?: string;
  artistLinkUrl?: string;
  artistViewUrl?: string;
  collectionId?: number;
  collectionName?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
  artworkUrl100?: string;
  releaseDate?: string;
};

async function call(path: string, params: Record<string, string | number>): Promise<ItunesResult[]> {
  const query = new URLSearchParams({ ...STORE, ...params } as Record<string, string>);
  const response = await fetch(`${BASE}/${path}?${query}`, { cache: "no-store" });
  if (!response.ok) {
    // 呼び出し回数の上限（1 分あたり 20 回ほど）に当たると 403 / 429 が返る
    throw new Error(
      response.status === 403 || response.status === 429
        ? "iTunes への問い合わせが多すぎます。1 分ほど待ってからもう一度お試しください。"
        : `iTunes から曲を取得できませんでした（${response.status}）`,
    );
  }
  const json = (await response.json()) as { results?: ItunesResult[] };
  return json.results ?? [];
}

/** アーティスト名で検索して候補を返す（表記が英字になることがあるので本人に選んでもらう） */
export async function searchItunesArtists(term: string): Promise<ItunesArtist[]> {
  const results = await call("search", { term, entity: "musicArtist", limit: 8 });
  return results
    .filter((r) => r.artistId && r.artistName)
    .map((r) => ({
      id: r.artistId!,
      name: r.artistName!,
      genre: r.primaryGenreName ?? null,
      url: r.artistLinkUrl ?? r.artistViewUrl ?? null,
    }));
}

/** 画像 URL の大きさを変える（100x100 → 300x300） */
function resizeArtwork(url: string | undefined): string | null {
  return url ? url.replace(/\/\d+x\d+bb\./, "/300x300bb.") : null;
}

/**
 * アーティストの全曲を取る。
 *
 * 曲を直接引くと 200 件で打ち切られるため、アルバム（シングル含む）の一覧を取ってから
 * アルバムごとに曲を引き直す。同じ曲がシングル・アルバム・ライブ盤に重複して入るので、
 * 正規化した曲名で 1 曲にまとめ、いちばん古い発売日のもの（原曲）を代表にする。
 */
export async function fetchItunesArtistSongs(artistId: number): Promise<CatalogSong[]> {
  const tracks: ItunesResult[] = [];

  // 1) 曲を直接引く（大半はここで取れる）と、アルバムの一覧を同時に取る
  const [direct, albumResults] = await Promise.all([
    call("lookup", { id: artistId, entity: "song", limit: LOOKUP_LIMIT }),
    call("lookup", { id: artistId, entity: "album", limit: LOOKUP_LIMIT }),
  ]);
  tracks.push(...direct);

  // 2) アルバムごとの曲。直接引いたときの 200 件の打ち切りで漏れた曲を拾う
  const albums = albumResults
    .filter((r) => r.wrapperType === "collection" && r.collectionId)
    .map((r) => r.collectionId!);

  const chunks: string[] = [];
  for (let i = 0; i < albums.length; i += ALBUMS_PER_REQUEST) {
    chunks.push(albums.slice(i, i + ALBUMS_PER_REQUEST).join(","));
  }
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      chunks
        .slice(i, i + CONCURRENCY)
        .map((ids) => call("lookup", { id: ids, entity: "song", limit: LOOKUP_LIMIT })),
    );
    for (const results of batch) tracks.push(...results);
  }

  // 3) 本人名義の曲だけにして、曲名で 1 曲にまとめる
  const byKey = new Map<string, CatalogSong>();
  for (const t of tracks) {
    if (t.wrapperType !== "track" || t.kind !== "song") continue;
    if (t.artistId !== artistId || !t.trackName || !t.trackId) continue;

    const key = titleKey(t.trackName);
    if (!key) continue;

    const song: CatalogSong = {
      // 版違いの付記（(Live) など）を外した名前があればそちらを表示名にする
      title: t.trackName,
      titleKey: key,
      album: t.collectionName ?? null,
      releaseDate: t.releaseDate ? t.releaseDate.slice(0, 10) : null,
      artworkUrl: resizeArtwork(t.artworkUrl100),
      trackUrl: t.trackViewUrl ?? null,
      trackId: t.trackId,
    };

    const current = byKey.get(key);
    const isOlder =
      !current || (song.releaseDate ?? "9999") < (current.releaseDate ?? "9999");
    // 同じ日なら付記の少ない（短い）曲名を原曲とみなす
    const isCleaner =
      current && song.releaseDate === current.releaseDate && song.title.length < current.title.length;
    if (isOlder || isCleaner) byKey.set(key, song);
  }

  return [...byKey.values()].sort(
    (a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "") || a.title.localeCompare(b.title, "ja"),
  );
}
