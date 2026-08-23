"use client";

import Link from "next/link";
import { useState } from "react";

import { Modal } from "@/components/Modal";
import { ExternalLinkIcon, HeartIcon, TicketIcon } from "@/components/icons";
import type { ArtistSummary } from "@/lib/artists";
import { formatDate } from "@/lib/format";

import { ArtistSettingsForm } from "./ArtistSettingsForm";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.6rem] text-faint">{label}</p>
      <p className={`truncate text-xs font-semibold ${accent ? "text-neon-cyan" : ""}`}>{value}</p>
    </div>
  );
}

export function ArtistsClient({ artists }: { artists: ArtistSummary[] }) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const editing = editingName ? (artists.find((a) => a.name === editingName) ?? null) : null;

  if (artists.length === 0) {
    return (
      <div className="panel flex flex-col items-center px-6 py-14 text-center">
        <HeartIcon className="h-10 w-10 text-line" />
        <p className="mt-4 text-sm text-muted">
          ライブを登録すると、そのアーティストがここに並びます。
        </p>
        <Link href="/lives" className="btn btn-primary mt-5">
          ライブ一覧へ
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {artists.map((artist) => (
          <li key={artist.name} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-neon-cyan">{artist.name}</h2>

              {artist.fanDays !== null ? (
                <span className="badge bg-neon-pink/15 text-neon-pink ring-1 ring-neon-pink/40">
                  応援 {artist.fanDays.toLocaleString()} 日目
                </span>
              ) : null}

              {artist.settings?.url ? (
                <a
                  href={artist.settings.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.7rem] text-neon-blue hover:underline"
                >
                  リンク
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => setEditingName(artist.name)}
                className="btn btn-ghost ml-auto px-3 py-1 text-xs"
              >
                設定
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
              <Stat
                label="初参戦"
                value={artist.firstLiveDate ? formatDate(artist.firstLiveDate) : "まだ"}
                accent={Boolean(artist.firstLiveDate)}
              />
              <Stat label="参戦済み" value={`${artist.attended} 回`} />
              <Stat
                label="次の参戦"
                value={artist.nextLiveDate ? formatDate(artist.nextLiveDate) : "予定なし"}
              />
              <Stat
                label="応援開始"
                value={artist.settings?.fan_since ? formatDate(artist.settings.fan_since) : "未設定"}
              />
            </div>

            {artist.settings?.memo ? (
              <p className="mt-3 border-t border-line-soft pt-3 text-xs whitespace-pre-wrap text-muted">
                {artist.settings.memo}
              </p>
            ) : null}

            {artist.attended + artist.upcoming > 0 ? (
              <Link
                href={`/lives?artist=${encodeURIComponent(artist.name)}&status=all&sort=desc`}
                className="btn btn-ghost mt-3 w-full text-xs"
              >
                <TicketIcon className="h-3.5 w-3.5" />
                このアーティストのライブを見る（{artist.attended + artist.upcoming} 件）
              </Link>
            ) : (
              <p className="mt-3 text-[0.7rem] text-faint">まだライブの記録がありません。</p>
            )}
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditingName(null)}
        title={editing ? `${editing.name} の設定` : "設定"}
      >
        {editing ? (
          <ArtistSettingsForm
            key={editing.name}
            artist={editing}
            onSaved={() => setEditingName(null)}
            onCancel={() => setEditingName(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}
