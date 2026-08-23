import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";
import { SetupError } from "@/components/SetupError";
import { StatTile } from "@/components/StatTile";
import { HeartIcon } from "@/components/icons";
import { ArtistsClient } from "@/components/artists/ArtistsClient";
import { buildArtistSummaries } from "@/lib/artists";
import { todayInTokyo } from "@/lib/format";
import { loadArtistSettings, loadLives } from "@/lib/lives";

export const metadata: Metadata = { title: "アーティスト" };

export default async function ArtistsPage() {
  const today = todayInTokyo();

  const [livesResult, settingsResult] = await Promise.all([loadLives(), loadArtistSettings()]);
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
  const withFanSince = artists.filter((a) => a.fanDays !== null);
  const longest = withFanSince.reduce<number>((max, a) => Math.max(max, a.fanDays ?? 0), 0);

  return (
    <main>
      <PageHeader
        title="アーティスト"
        description="応援開始日を設定すると「応援して〇日目」を数えます。"
        icon={HeartIcon}
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatTile label="アーティスト" value={artists.length} unit="組" accent="violet" />
        <StatTile label="応援開始日あり" value={withFanSince.length} unit="組" accent="pink" />
        <StatTile
          label="最長の応援"
          value={longest > 0 ? longest.toLocaleString() : "—"}
          unit={longest > 0 ? "日目" : undefined}
          accent="cyan"
        />
      </div>

      <ArtistsClient artists={artists} />
    </main>
  );
}
