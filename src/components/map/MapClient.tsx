"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { formatDateShort } from "@/lib/format";
import { PREFECTURES, prefecturesByRegion } from "@/lib/prefectures";
import type { Live } from "@/lib/types";

import { JapanMap } from "./JapanMap";
import { LEVEL_FILLS, countLevel } from "./mapScale";

export function MapClient({ lives, counts }: { lives: Live[]; counts: Record<string, number> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const livesByPref = useMemo(() => {
    const map = new Map<string, Live[]>();
    for (const live of lives) {
      if (!live.prefecture_code) continue;
      const list = map.get(live.prefecture_code);
      if (list) list.push(live);
      else map.set(live.prefecture_code, [live]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.live_date.localeCompare(a.live_date));
    }
    return map;
  }, [lives]);

  const selectedPref = selected ? PREFECTURES.find((p) => p.code === selected) : null;
  const selectedLives = selected ? (livesByPref.get(selected) ?? []) : [];
  const unassigned = lives.filter((l) => !l.prefecture_code).length;

  const handleSelect = (code: string) => {
    setSelected((prev) => (prev === code ? null : code));
    // スマホでは地図の下の詳細が画面外になるのでスクロールする
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <>
      <div className="panel p-4 sm:p-6">
        <JapanMap counts={counts} selectedCode={selected} onSelect={handleSelect} />
      </div>

      <div ref={detailRef} className="mt-4">
        {selectedPref ? (
          <div className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">{selectedPref.name}</h2>
              <span className="badge bg-white/5 text-muted ring-1 ring-line">
                {selectedPref.region}
              </span>
              <span className="ml-auto text-sm">
                <span className="text-2xl font-black text-neon-pink">
                  {counts[selectedPref.code] ?? 0}
                </span>
                <span className="ml-1 text-xs text-muted">回</span>
              </span>
            </div>

            {selectedLives.length > 0 ? (
              <>
                <ul className="mt-3 divide-y divide-line-soft">
                  {selectedLives.slice(0, 8).map((live) => (
                    <li key={live.id} className="flex items-baseline gap-3 py-2">
                      <span className="w-20 shrink-0 text-xs text-faint">
                        {live.live_date.slice(0, 4)}
                        <br />
                        {formatDateShort(live.live_date)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-neon-cyan">
                          {live.artist_name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {live.live_title}
                          {live.venue ? ` ・ ${live.venue}` : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/lives?pref=${selectedPref.code}`}
                  className="btn btn-ghost mt-3 w-full text-xs"
                >
                  {selectedPref.name}のライブをすべて見る（{selectedLives.length} 件）
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                まだ {selectedPref.name} での参戦記録はありません。
              </p>
            )}
          </div>
        ) : (
          <p className="px-1 text-center text-xs text-faint">
            地図または下の一覧から都道府県を選ぶと、その県のライブが表示されます。
          </p>
        )}
      </div>

      {unassigned > 0 ? (
        <p className="mt-4 rounded-xl border border-today/30 bg-today/10 px-4 py-2.5 text-xs text-today">
          都道府県が未設定のライブが {unassigned} 件あります。編集して設定すると地図に反映されます。
        </p>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-muted">地域別の制覇状況</h2>
        <div className="space-y-3">
          {prefecturesByRegion().map(({ region, prefectures }) => {
            const conquered = prefectures.filter((p) => (counts[p.code] ?? 0) > 0).length;

            return (
              <div key={region} className="panel p-3.5">
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-sm font-bold">{region}</h3>
                  <span className="text-xs text-faint">
                    {conquered} / {prefectures.length}
                  </span>
                  <span className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-pink"
                      style={{ width: `${(conquered / prefectures.length) * 100}%` }}
                    />
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {prefectures.map((pref) => {
                    const count = counts[pref.code] ?? 0;
                    const level = countLevel(count);
                    const isSelected = selected === pref.code;

                    return (
                      <button
                        key={pref.code}
                        type="button"
                        onClick={() => handleSelect(pref.code)}
                        aria-pressed={isSelected}
                        className={`badge transition ${
                          count > 0 ? "text-white" : "text-faint"
                        } ${isSelected ? "ring-2 ring-neon-cyan" : "ring-1 ring-black/30"}`}
                        style={{ backgroundColor: LEVEL_FILLS[level] }}
                      >
                        {pref.shortName}
                        {count > 0 ? <span className="opacity-80">{count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
