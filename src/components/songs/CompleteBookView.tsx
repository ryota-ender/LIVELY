"use client";

import { useState } from "react";

import { formatDate } from "@/lib/format";
import type { CompleteBook } from "@/lib/song-stats";

type Filter = "all" | "heard" | "unheard";

export function CompleteBookView({ book }: { book: CompleteBook }) {
  const [filter, setFilter] = useState<Filter>("all");

  const entries = book.entries.filter((e) =>
    filter === "heard" ? e.heard : filter === "unheard" ? !e.heard : true,
  );

  const tabs: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: "すべて", count: book.total },
    { key: "heard", label: "聴いた", count: book.heardCount },
    { key: "unheard", label: "まだ", count: book.total - book.heardCount },
  ];

  return (
    <>
      <div className="mb-3 flex rounded-xl border border-line bg-surface/60 p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            aria-pressed={filter === tab.key}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              filter === tab.key ? "bg-white/10 text-text" : "text-faint hover:text-text"
            }`}
          >
            {tab.label}
            <span className="ml-1 font-normal opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="panel px-4 py-8 text-center text-sm text-faint">
          {filter === "heard" ? "まだ聴いた曲がありません。" : "すべて聴きました。"}
        </p>
      ) : (
        <ul className="panel divide-y divide-line-soft">
          {entries.map(({ song, heard }) => (
            <li key={song.id} className="flex items-center gap-3 px-3 py-2.5">
              {/* 聴いた曲はジャケットを色付きで、まだの曲は色を抜いて見せる */}
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
                {song.artwork_url ? (
                  // iTunes の画像を小さく出すだけなので next/image の最適化は使わない
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.artwork_url}
                    alt=""
                    loading="lazy"
                    width={44}
                    height={44}
                    // 取得に失敗したら壊れた画像の表示を出さず、無地の枠だけにする
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className={`h-full w-full object-cover ${heard ? "" : "opacity-30 grayscale"}`}
                  />
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm font-semibold ${heard ? "text-text" : "text-faint"}`}
                >
                  {song.title}
                </span>
                <span className="block truncate text-[0.65rem] text-faint">
                  {[song.release_date?.slice(0, 4), song.album].filter(Boolean).join(" / ")}
                </span>
              </span>

              <span className="shrink-0 text-right">
                {heard ? (
                  <>
                    <span className="block text-sm font-black text-neon-pink">{heard.count} 回</span>
                    <span className="block text-[0.6rem] text-faint">
                      初 {formatDate(heard.firstDate)}
                    </span>
                  </>
                ) : (
                  <span className="text-[0.7rem] text-faint">まだ</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {book.extras.length > 0 && filter !== "unheard" ? (
        <section className="mt-5">
          <h2 className="mb-1 text-sm font-bold">カタログにない曲</h2>
          <p className="mb-2 text-[0.65rem] text-faint">
            未発表曲やカバー、セトリの表記が配信版と大きく違う曲です。
          </p>
          <ul className="panel divide-y divide-line-soft">
            {book.extras.map((extra) => (
              <li key={extra.titleKey} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm">{extra.title}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-black text-neon-pink">{extra.count} 回</span>
                  <span className="block text-[0.6rem] text-faint">
                    初 {formatDate(extra.firstDate)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
