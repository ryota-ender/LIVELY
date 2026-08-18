import type { Metadata } from "next";

import { StatTile } from "@/components/StatTile";
import { MapClient } from "@/components/map/MapClient";
import { todayInTokyo } from "@/lib/format";
import { fetchLives } from "@/lib/lives";
import { countByPrefecture, summarize } from "@/lib/stats";

export const metadata: Metadata = { title: "制覇マップ" };

export default async function MapPage() {
  const today = todayInTokyo();
  const lives = await fetchLives();

  const counts = countByPrefecture(lives);
  const summary = summarize(lives, today);
  const ratePercent = Math.round(summary.conqueredRate * 100);

  return (
    <main>
      <h1 className="mb-1 text-xl font-black">都道府県 制覇マップ</h1>
      <p className="mb-4 text-xs text-muted">
        参戦した都道府県が濃く光ります。色が濃いほど参戦回数が多い県です。
      </p>

      <div className="panel mb-4 px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold text-faint">制覇率</p>
            <p className="mt-0.5">
              <span className="neon-text text-4xl leading-none font-black">{ratePercent}</span>
              <span className="ml-1 text-sm text-muted">%</span>
            </p>
          </div>
          <p className="text-right text-xs text-muted">
            <span className="text-xl font-black text-text">{summary.conquered}</span>
            <span className="mx-1">/</span>
            {summary.prefectureTotal} 都道府県
          </p>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-pink via-neon-violet to-neon-blue transition-[width] duration-700"
            style={{ width: `${ratePercent}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatTile label="参戦したライブ" value={summary.total} unit="本" accent="pink" />
        <StatTile label="アーティスト" value={summary.artists} unit="組" accent="violet" />
        <StatTile label="会場" value={summary.venues} unit="カ所" accent="cyan" />
      </div>

      <MapClient lives={lives} counts={counts} />
    </main>
  );
}
