import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { SetupError } from "@/components/SetupError";
import { StatTile } from "@/components/StatTile";
import { HeartIcon } from "@/components/icons";
import { ArtistsClient } from "@/components/artists/ArtistsClient";
import { buildArtistSummaries, formatFanDuration } from "@/lib/artists";
import { todayInTokyo } from "@/lib/format";
import { loadArtistSettings, loadLives, loadSongs } from "@/lib/lives";
import { buildCompleteBook, collectHeardSongs } from "@/lib/song-stats";

export const metadata: Metadata = { title: "アーティスト" };

export default async function ArtistsPage() {
  const today = todayInTokyo();

  const [livesResult, settingsResult, songsResult] = await Promise.all([
    loadLives(),
    loadArtistSettings(),
    loadSongs(),
  ]);
  if (!livesResult.ok) {
    return (
      <main>
        <PageHeader title="アーティスト" icon={HeartIcon} />
        <SetupError error={livesResult} />
      </main>
    );
  }
  if (!settingsResult.ok) {
    return (
      <main>
        <PageHeader title="アーティスト" icon={HeartIcon} />
        <SetupError error={settingsResult} />
      </main>
    );
  }

  const artists = buildArtistSummaries(livesResult.data, settingsResult.data, today);

  // 全曲を取り込んだアーティストだけ、コンプリート率を出す（曲データは画面に渡さず数だけ渡す）
  const songs = songsResult.ok ? songsResult.data : [];
  const heard = collectHeardSongs(livesResult.data, songs, today);
  const completion: Record<string, { heard: number; total: number }> = {};
  for (const name of new Set(songs.map((s) => s.artist_name))) {
    const book = buildCompleteBook(name, songs, heard);
    completion[name] = { heard: book.heardCount, total: book.total };
  }
  const withFanSince = artists.filter((a) => a.fanDuration !== null);
  // 通算日数がいちばん長いものを「最長の応援」として出す
  const longest = withFanSince.reduce<(typeof withFanSince)[number] | null>(
    (best, a) =>
      !best || (a.fanDuration?.totalDays ?? 0) > (best.fanDuration?.totalDays ?? 0) ? a : best,
    null,
  );

  return (
    <main>
      <PageHeader
        title="アーティスト"
        description="応援開始日を設定すると、そこからの経過を数えます。"
        icon={HeartIcon}
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatTile label="アーティスト" value={artists.length} unit="組" accent="violet" />
        <StatTile label="応援開始日あり" value={withFanSince.length} unit="組" accent="pink" />
        <StatTile
          label="最長の応援"
          value={longest?.fanDuration ? formatFanDuration(longest.fanDuration) : "—"}
          hint={longest?.fanDuration ? longest.name : undefined}
          accent="cyan"
        />
      </div>

      <Link href="/songs" className="btn btn-ghost mb-4 w-full text-xs">
        聴いた曲ランキングとコンプリートブック
      </Link>

      <ArtistsClient artists={artists} completion={completion} />
    </main>
  );
}
