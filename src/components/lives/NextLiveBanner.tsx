import { daysBetween, formatDate, formatTime } from "@/lib/format";
import { prefectureName } from "@/lib/prefectures";
import type { Live } from "@/lib/types";

import { MicIcon } from "../icons";

import { DoorCountdown } from "./DoorCountdown";

export function NextLiveBanner({ live, today }: { live: Live; today: string }) {
  const days = daysBetween(today, live.live_date);
  const pref = prefectureName(live.prefecture_code);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-neon-violet/40 bg-gradient-to-r from-neon-pink/15 via-neon-violet/12 to-neon-blue/15 px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <MicIcon className="h-4 w-4 shrink-0 text-neon-pink" />
        <span className="text-sm font-black">
          {days === 0 ? (
            <span className="text-today">本日開催！</span>
          ) : (
            <>
              次のライブまで <span className="neon-text text-lg">あと {days}</span> 日
            </>
          )}
        </span>
        <DoorCountdown
          liveDate={live.live_date}
          openTime={live.open_time}
          startTime={live.start_time}
        />
        <span className="text-xs text-muted">
          {live.artist_name} / {live.live_title}
        </span>
      </div>
      <p className="mt-1 text-[0.7rem] text-faint">
        {formatDate(live.live_date)} 開演 {formatTime(live.start_time)}
        {live.venue ? ` ・ ${pref ? `${pref} ` : ""}${live.venue}` : ""}
      </p>
    </div>
  );
}
