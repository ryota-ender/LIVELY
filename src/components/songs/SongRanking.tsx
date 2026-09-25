"use client";

import Link from "next/link";
import { useState } from "react";

import type { HeardSong } from "@/lib/song-stats";

const PREVIEW = 20;

/** 聴いた曲ランキング（最初は 20 位まで、残りはその場で開く） */
export function SongRanking({ songs }: { songs: HeardSong[] }) {
  const [expanded, setExpanded] = useState(false);

  if (songs.length === 0) {
    return (
      <p className="panel px-4 py-8 text-center text-sm text-faint">
        ライブのセトリを入力すると、聴いた曲がここに並びます。
      </p>
    );
  }

  const shown = expanded ? songs : songs.slice(0, PREVIEW);

  return (
    <>
      <ol className="panel divide-y divide-line-soft">
        {shown.map((song, index) => (
          <li key={`${song.artist}-${song.titleKey}`} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-6 shrink-0 text-center text-xs font-black text-faint">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{song.title}</span>
              <Link
                href={`/songs?artist=${encodeURIComponent(song.artist)}`}
                className="block truncate text-[0.65rem] text-neon-cyan hover:underline"
              >
                {song.artist}
              </Link>
            </span>
            <span className="shrink-0 text-sm font-black text-neon-pink">{song.count} 回</span>
          </li>
        ))}
      </ol>

      {songs.length > PREVIEW ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn btn-ghost mt-3 w-full text-xs"
        >
          {expanded ? "表示を減らす" : `すべて見る（残り ${songs.length - PREVIEW} 曲）`}
        </button>
      ) : null}
    </>
  );
}
