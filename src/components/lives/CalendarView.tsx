"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { liveStatus } from "@/lib/format";

import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import type { LiveWithImage } from "@/lib/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const DOT_CLASS = {
  upcoming: "bg-neon-blue/20 text-neon-blue",
  today: "bg-today/25 text-today",
  past: "bg-white/8 text-muted",
} as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CalendarView({ lives, today }: { lives: LiveWithImage[]; today: string }) {
  const [cursor, setCursor] = useState(() => ({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)),
  }));

  const byDate = useMemo(() => {
    const map = new Map<string, LiveWithImage[]>();
    for (const live of lives) {
      const list = map.get(live.live_date);
      if (list) list.push(live);
      else map.set(live.live_date, [live]);
    }
    return map;
  }, [lives]);

  const { y, m } = cursor;
  const startDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const shift = (delta: number) => {
    setCursor((prev) => {
      const next = prev.m + delta;
      if (next < 1) return { y: prev.y - 1, m: 12 };
      if (next > 12) return { y: prev.y + 1, m: 1 };
      return { y: prev.y, m: next };
    });
  };

  const goToday = () =>
    setCursor({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="前の月"
          className="btn btn-ghost p-1.5"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="min-w-28 text-center text-sm font-bold">
          {y}年 {m}月
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="次の月"
          className="btn btn-ghost p-1.5"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={goToday} className="btn btn-ghost ml-auto px-3 py-1 text-xs">
          今月
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line-soft text-center text-[0.65rem] font-semibold">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 ${i === 0 ? "text-red-300" : i === 6 ? "text-neon-blue" : "text-faint"}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - startDow + 1;
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dateStr = inMonth ? `${y}-${pad(m)}-${pad(dayNum)}` : "";
          const dayLives = inMonth ? (byDate.get(dateStr) ?? []) : [];
          const isToday = dateStr === today;

          return (
            <div
              key={i}
              className={`min-h-20 border-r border-b border-line-soft/60 p-1 last:border-r-0 ${
                inMonth ? "" : "bg-black/20"
              }`}
            >
              {inMonth ? (
                <>
                  <div
                    className={`mb-1 text-center text-[0.65rem] font-semibold ${
                      isToday
                        ? "mx-auto w-5 rounded-full bg-today text-ink"
                        : i % 7 === 0
                          ? "text-red-300"
                          : i % 7 === 6
                            ? "text-neon-blue"
                            : "text-muted"
                    }`}
                  >
                    {dayNum}
                  </div>

                  <div className="space-y-0.5">
                    {dayLives.map((live) => (
                      <Link
                        key={live.id}
                        href={`/lives/${live.id}`}
                        title={`${live.artist_name} / ${live.live_title}`}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[0.6rem] font-semibold transition hover:brightness-125 ${
                          DOT_CLASS[liveStatus(live.live_date, today)]
                        }`}
                      >
                        {live.artist_name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
