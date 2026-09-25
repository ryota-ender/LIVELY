"use client";

import { useState, useTransition } from "react";

import { findArtistCandidates, importArtistCatalog } from "@/app/(app)/songs/actions";
import type { ItunesArtist } from "@/lib/itunes";

/**
 * アーティストの全曲を iTunes から取り込む。
 * 初回は名前で検索して候補から選んでもらい、2 回目以降は覚えておいた ID で取り込み直す。
 */
export function CatalogImporter({
  artistName,
  itunesArtistId,
  songCount,
  compact = false,
}: {
  artistName: string;
  /** 前回取り込んだ iTunes のアーティスト ID */
  itunesArtistId: number | null;
  songCount: number;
  /** 一覧の中に置くときの小さい表示 */
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<ItunesArtist[] | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const runImport = (id: number) => {
    setMessage(null);
    startTransition(async () => {
      const result = await importArtistCatalog(artistName, id);
      if (result.ok) {
        setCandidates(null);
        setMessage({ tone: "ok", text: `${result.count} 曲を取り込みました。` });
      } else {
        setMessage({ tone: "error", text: result.message });
      }
    });
  };

  const search = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await findArtistCandidates(artistName);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
      } else if (result.candidates.length === 0) {
        setMessage({ tone: "error", text: "候補が見つかりませんでした。" });
      } else {
        setCandidates(result.candidates);
      }
    });
  };

  const buttonClass = `btn btn-ghost ${compact ? "px-3 py-1 text-xs" : "text-xs"}`;

  return (
    <div className="min-w-0">
      {candidates ? (
        <div className="rounded-xl border border-line bg-ink/50 p-3">
          <p className="text-xs text-muted">
            取り込むアーティストを選んでください（Apple の表記で出ます）。
          </p>
          <ul className="mt-2 divide-y divide-line-soft">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.name}</span>
                  {c.genre ? <span className="text-[0.65rem] text-faint">{c.genre}</span> : null}
                </span>
                <button
                  type="button"
                  className="btn btn-primary shrink-0 px-3 py-1 text-xs"
                  disabled={pending}
                  onClick={() => runImport(c.id)}
                >
                  これにする
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-1 text-[0.7rem] text-faint underline-offset-2 hover:underline"
            onClick={() => setCandidates(null)}
            disabled={pending}
          >
            やめる
          </button>
        </div>
      ) : itunesArtistId ? (
        <button type="button" className={buttonClass} disabled={pending} onClick={() => runImport(itunesArtistId)}>
          {pending ? "取り込み中…" : songCount > 0 ? "曲を取り込み直す" : "曲を取り込む"}
        </button>
      ) : (
        <button type="button" className={buttonClass} disabled={pending} onClick={search}>
          {pending ? "探しています…" : "全曲を取り込む"}
        </button>
      )}

      {itunesArtistId && !candidates ? (
        <button
          type="button"
          className="ml-2 text-[0.65rem] text-faint underline-offset-2 hover:underline"
          disabled={pending}
          onClick={search}
        >
          別のアーティストから選び直す
        </button>
      ) : null}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mt-2 text-xs ${message.tone === "error" ? "text-red-300" : "text-neon-cyan"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
