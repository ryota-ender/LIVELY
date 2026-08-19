"use client";

import {
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  formatDate,
  formatTime,
  liveStatus,
  mapUrl,
} from "@/lib/format";
import { prefectureName } from "@/lib/prefectures";
import { LIVE_TYPE_LABELS, type LiveWithImage } from "@/lib/types";

import { DoorCountdown } from "./DoorCountdown";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-line-soft py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-faint">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  );
}

export function LiveDetail({ live, today }: { live: LiveWithImage; today: string }) {
  const status = liveStatus(live.live_date, today);
  const pref = prefectureName(live.prefecture_code);
  const url = mapUrl(live.venue, pref);

  return (
    <div>
      {live.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={live.image_url}
          alt=""
          className="mb-4 max-h-64 w-full rounded-xl border border-line object-cover"
        />
      ) : null}

      <dl>
        <Row label="ステータス">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_BADGE_CLASS[status]}`}>{STATUS_LABELS[status]}</span>
            <DoorCountdown
              liveDate={live.live_date}
              openTime={live.open_time}
              startTime={live.start_time}
            />
          </span>
        </Row>
        <Row label="アーティスト">
          <span className="font-bold text-neon-cyan">{live.artist_name}</span>
        </Row>
        <Row label="共演">
          {live.co_artists.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {live.co_artists.map((artist) => (
                <span key={artist} className="badge bg-white/5 text-muted ring-1 ring-line">
                  {artist}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-faint">なし</span>
          )}
        </Row>
        <Row label="タイトル">
          <span className="font-semibold">{live.live_title}</span>
        </Row>
        <Row label="種別">
          {live.live_type ? (
            LIVE_TYPE_LABELS[live.live_type]
          ) : (
            <span className="text-faint">未設定</span>
          )}
        </Row>
        <Row label="開催日">{formatDate(live.live_date)}</Row>
        <Row label="時間">
          開場 {formatTime(live.open_time)} / 開演 {formatTime(live.start_time)}
        </Row>
        <Row label="都道府県">
          {pref || <span className="text-faint">未設定</span>}
        </Row>
        <Row label="会場">
          {live.venue ? (
            <>
              {live.venue}
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-xs text-neon-blue hover:underline"
                >
                  地図で開く ↗
                </a>
              ) : null}
            </>
          ) : (
            <span className="text-faint">未設定</span>
          )}
        </Row>
        <Row label="メモ">
          {live.memo ? (
            <span className="whitespace-pre-wrap">{live.memo}</span>
          ) : (
            <span className="text-faint">なし</span>
          )}
        </Row>
        <Row label="セットリスト">
          {live.setlist ? (
            <span className="block rounded-lg bg-ink/60 p-3 font-mono text-xs whitespace-pre-wrap">
              {live.setlist}
            </span>
          ) : (
            <span className="text-faint">未記入</span>
          )}
        </Row>
      </dl>
    </div>
  );
}
