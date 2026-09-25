import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { SetupError } from "@/components/SetupError";
import { StatTile } from "@/components/StatTile";
import { CatalogImporter } from "@/components/songs/CatalogImporter";
import { CompleteBookView } from "@/components/songs/CompleteBookView";
import { SongRanking } from "@/components/songs/SongRanking";
import { buildArtistSummaries } from "@/lib/artists";
import { formatDate, todayInTokyo } from "@/lib/format";
import { loadArtistSettings, loadLives, loadSongs } from "@/lib/lives";
import { buildCompleteBook, collectHeardSongs } from "@/lib/song-stats";

export const metadata: Metadata = { title: "聴いた曲" };

// 全曲の取り込みは iTunes に何度か問い合わせるので、既定より長く待てるようにする
export const maxDuration = 60;

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string | string[] }>;
}) {
  const params = await searchParams;
  const artistParam = Array.isArray(params.artist) ? params.artist[0] : params.artist;
  const today = todayInTokyo();

  const [livesResult, songsResult, settingsResult] = await Promise.all([
    loadLives(),
    loadSongs(),
    loadArtistSettings(),
  ]);
  for (const result of [livesResult, songsResult, settingsResult]) {
    if (!result.ok) {
      return (
        <main>
          <PageHeader title="聴いた曲" />
          <SetupError error={result} />
        </main>
      );
    }
  }
  if (!livesResult.ok || !songsResult.ok || !settingsResult.ok) return null;

  const lives = livesResult.data;
  const songs = songsResult.data;
  const settings = settingsResult.data;
  const heard = collectHeardSongs(lives, songs, today);

  // ---------- アーティストのコンプリートブック ----------
  if (artistParam) {
    const book = buildCompleteBook(artistParam, songs, heard);
    const setting = settings.find((s) => s.name === artistParam) ?? null;
    const percent = Math.round(book.rate * 100);

    return (
      <main>
        <Link href="/songs" className="mb-3 inline-block text-xs text-faint hover:text-text">
          聴いた曲へ戻る
        </Link>

        <h1 className="text-xl leading-tight font-black">{artistParam}</h1>
        <p className="mt-1 mb-4 text-xs text-muted">コンプリートブック</p>

        {book.total > 0 ? (
          <div className="panel mb-4 px-4 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold text-faint">聴いた曲</p>
                <p className="mt-0.5">
                  <span className="neon-text text-4xl leading-none font-black">{book.heardCount}</span>
                  <span className="ml-1 text-sm text-muted">/ {book.total} 曲</span>
                </p>
              </div>
              <p className="text-3xl font-black text-neon-pink">
                {percent}
                <span className="ml-0.5 text-sm text-muted">%</span>
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-pink via-neon-violet to-neon-blue"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line-soft pt-3">
              <CatalogImporter
                artistName={artistParam}
                itunesArtistId={setting?.itunes_artist_id ?? null}
                songCount={book.total}
                compact
              />
              {setting?.catalog_updated_at ? (
                <span className="text-[0.65rem] text-faint">
                  {formatDate(setting.catalog_updated_at.slice(0, 10))} 取り込み
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="panel mb-4 px-4 py-5">
            <p className="text-sm">まだ全曲を取り込んでいません。</p>
            <p className="mt-1 mb-3 text-xs text-muted">
              取り込むと、全曲のうちどの曲をライブで聴いたかが分かります。
            </p>
            <CatalogImporter
              artistName={artistParam}
              itunesArtistId={setting?.itunes_artist_id ?? null}
              songCount={0}
            />
          </div>
        )}

        {book.total > 0 || book.extras.length > 0 ? <CompleteBookView book={book} /> : null}

        <p className="mt-6 text-[0.6rem] text-faint">曲のデータ: Apple（iTunes Search API）</p>
      </main>
    );
  }

  // ---------- 全体：ランキングとコンプリート状況 ----------
  const artists = buildArtistSummaries(lives, settings, today);
  const songCountByArtist = new Map<string, number>();
  for (const s of songs) songCountByArtist.set(s.artist_name, (songCountByArtist.get(s.artist_name) ?? 0) + 1);

  const withCatalog = artists
    .filter((a) => songCountByArtist.has(a.name))
    .map((a) => ({ artist: a, book: buildCompleteBook(a.name, songs, heard) }))
    .sort((x, y) => y.book.rate - x.book.rate || x.artist.name.localeCompare(y.artist.name, "ja"));
  const withoutCatalog = artists.filter((a) => !songCountByArtist.has(a.name));

  return (
    <main>
      <PageHeader
        title="聴いた曲"
        description="ライブのセトリから、これまでに聴いた曲を数えます。"
      />

      <div className="mb-5 grid grid-cols-3 gap-2">
        <StatTile label="聴いた曲" value={heard.length} unit="曲" accent="pink" />
        <StatTile label="取り込み済み" value={withCatalog.length} unit="組" accent="violet" />
        <StatTile
          label="いちばん聴いた曲"
          value={heard[0] ? `${heard[0].count}回` : "—"}
          hint={heard[0]?.title}
          accent="cyan"
        />
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold">聴いた曲ランキング</h2>
        <SongRanking songs={heard} />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-bold">コンプリート状況</h2>
        <p className="mb-2 text-[0.65rem] text-faint">
          全曲を取り込んだアーティストは、全曲のうちどれだけ聴いたかが出ます。
        </p>

        {withCatalog.length > 0 ? (
          <ul className="panel mb-3 divide-y divide-line-soft">
            {withCatalog.map(({ artist, book }) => {
              const percent = Math.round(book.rate * 100);
              return (
                <li key={artist.name}>
                  <Link
                    href={`/songs?artist=${encodeURIComponent(artist.name)}`}
                    className="block px-3 py-3 transition hover:bg-white/5"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neon-cyan">
                        {artist.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {book.heardCount} / {book.total} 曲
                      </span>
                      <span className="w-10 shrink-0 text-right text-sm font-black text-neon-pink">
                        {percent}%
                      </span>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/8">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-pink"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {withoutCatalog.length > 0 ? (
          <ul className="panel divide-y divide-line-soft">
            {withoutCatalog.map((artist) => {
              const setting = settings.find((s) => s.name === artist.name) ?? null;
              return (
                <li key={artist.name} className="px-3 py-3">
                  <p className="mb-2 truncate text-sm font-semibold">{artist.name}</p>
                  <CatalogImporter
                    artistName={artist.name}
                    itunesArtistId={setting?.itunes_artist_id ?? null}
                    songCount={0}
                    compact
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <p className="mt-6 text-[0.6rem] text-faint">曲のデータ: Apple（iTunes Search API）</p>
    </main>
  );
}
