"use client";

import {
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  formatDateShort,
  formatTime,
  liveStatus,
} from "@/lib/format";
import { prefectureName } from "@/lib/prefectures";
import { LIVE_TYPE_LABELS, type LiveWithImage } from "@/lib/types";

export function LiveCard({
  live,
  today,
  onClick,
}: {
  live: LiveWithImage;
  today: string;
  onClick: () => void;
}) {
  const status = liveStatus(live.live_date, today);
  const pref = prefectureName(live.prefecture_code);
  const [year, month, day] = live.live_date.split("-");

  return (
    <button
      type="button"
      onClick={onClick}
      className="panel group flex w-full flex-col overflow-hidden text-left transition hover:border-neon-violet/60 hover:shadow-[0_0_30px_-12px_rgba(168,85,247,0.8)]"
    >
      {live.image_url ? (
        // 署名付き URL は毎回変わるため next/image では最適化できない
        // eslint-disable-next-line @next/next/no-img-element
        <img src={live.image_url} alt="" className="h-32 w-full object-cover" />
      ) : null}

      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 text-center">
          <div className="text-[0.6rem] font-semibold text-faint">{year}</div>
          <div className="neon-text text-2xl leading-none font-black">
            {Number(month)}/{Number(day)}
          </div>
          <div className="mt-1 text-[0.6rem] text-faint">
            {formatDateShort(live.live_date).slice(-3)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`badge ${STATUS_BADGE_CLASS[status]}`}>{STATUS_LABELS[status]}</span>
            {live.live_type ? (
              <span className="badge bg-white/5 text-muted ring-1 ring-line">
                {LIVE_TYPE_LABELS[live.live_type]}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 truncate text-sm font-bold text-neon-cyan">{live.artist_name}</p>
          <p className="truncate text-sm font-semibold">{live.live_title}</p>

          <p className="mt-1 truncate text-xs text-muted">
            {pref ? <span className="text-faint">{pref} </span> : null}
            {live.venue || "会場未設定"}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-faint">
            開場 {formatTime(live.open_time)} / 開演 {formatTime(live.start_time)}
          </p>
        </div>
      </div>
    </button>
  );
}
