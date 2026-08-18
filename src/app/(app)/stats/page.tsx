import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/Section";
import { StatTile } from "@/components/StatTile";
import { BarList } from "@/components/charts/BarList";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { todayInTokyo } from "@/lib/format";
import { fetchLives } from "@/lib/lives";
import { PREFECTURES } from "@/lib/prefectures";
import {
  countByArtist,
  countByMonth,
  countByPrefecture,
  countByType,
  countByVenue,
  countByYear,
  summarize,
  type CountEntry,
} from "@/lib/stats";

export const metadata: Metadata = { title: "統計" };

export default async function StatsPage() {
  const today = todayInTokyo();
  const lives = await fetchLives();

  const summary = summarize(lives, today);
  const prefCounts = countByPrefecture(lives);

  const prefRanking: CountEntry[] = PREFECTURES.map((pref) => ({
    key: pref.code,
    label: pref.name,
    count: prefCounts[pref.code],
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, 10);

  return (
    <main>
      <h1 className="mb-4 text-xl font-black">統計</h1>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="参戦済み" value={summary.attended} unit="回" accent="pink" />
        <StatTile label="これから" value={summary.upcoming} unit="本" accent="blue" />
        <StatTile label="登録数" value={summary.total} unit="本" accent="violet" />
        <StatTile label="アーティスト" value={summary.artists} unit="組" accent="cyan" />
        <StatTile label="会場" value={summary.venues} unit="カ所" accent="violet" />
        <StatTile
          label="制覇率"
          value={Math.round(summary.conqueredRate * 100)}
          unit="%"
          hint={`${summary.conquered} / ${summary.prefectureTotal} 都道府県`}
          accent="pink"
        />
      </div>

      <div className="space-y-4">
        <Section title="年別の参戦数">
          <ColumnChart entries={countByYear(lives)} />
        </Section>

        <Section title="月別の参戦数" description="どの季節によく行っているか">
          <ColumnChart entries={countByMonth(lives)} />
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="アーティスト別 TOP20" description="共演も 1 回として数えます">
            <BarList entries={countByArtist(lives, 20)} accent="cyan" />
          </Section>

          <Section title="会場別 TOP10">
            <BarList entries={countByVenue(lives, 10)} accent="violet" />
          </Section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="都道府県別 TOP10"
            action={
              <Link href="/map" className="text-[0.7rem] text-neon-blue hover:underline">
                マップで見る →
              </Link>
            }
          >
            <BarList
              entries={prefRanking}
              accent="pink"
              emptyText="都道府県が設定されたライブがまだありません。"
            />
          </Section>

          <Section title="種別ごとの内訳">
            <BarList entries={countByType(lives)} accent="blue" />
          </Section>
        </div>
      </div>
    </main>
  );
}
