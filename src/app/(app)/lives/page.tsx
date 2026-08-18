import type { Metadata } from "next";

import { StatTile } from "@/components/StatTile";
import { FilterPanel } from "@/components/lives/FilterPanel";
import { LivesClient } from "@/components/lives/LivesClient";
import { NextLiveBanner } from "@/components/lives/NextLiveBanner";
import {
  applyFilters,
  distinctArtists,
  distinctYears,
  hasActiveFilters,
  parseFilters,
  type SearchParams,
} from "@/lib/filters";
import { todayInTokyo } from "@/lib/format";
import { fetchLivesWithImages } from "@/lib/lives";
import { nextLive, summarize } from "@/lib/stats";

export const metadata: Metadata = { title: "ライブ一覧" };

export default async function LivesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const today = todayInTokyo();

  const all = await fetchLivesWithImages();
  const lives = applyFilters(all, filters, today);

  const summary = summarize(all, today);
  const upcoming = nextLive(all, today);
  const duplicatePairs = all.map((l) => `${l.artist_name}|${l.live_date}`);

  return (
    <main>
      <h1 className="mb-3 text-xl font-black">ライブ一覧</h1>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatTile label="参戦済み" value={summary.attended} unit="回" accent="pink" />
        <StatTile label="これから" value={summary.upcoming} unit="本" accent="blue" />
        <StatTile
          label="制覇"
          value={summary.conquered}
          unit={`/ ${summary.prefectureTotal} 県`}
          accent="cyan"
        />
      </div>

      {upcoming ? <NextLiveBanner live={upcoming} today={today} /> : null}

      <FilterPanel
        filters={filters}
        artists={distinctArtists(all)}
        years={distinctYears(all)}
        resultCount={lives.length}
      />

      <LivesClient
        lives={lives}
        today={today}
        duplicatePairs={duplicatePairs}
        emptyMessage={
          all.length === 0
            ? "まだライブが登録されていません。最初の 1 本を記録しましょう。"
            : hasActiveFilters(filters)
              ? "条件に合うライブがありません。絞り込みを変えてみてください。"
              : "ライブがありません。"
        }
      />
    </main>
  );
}
