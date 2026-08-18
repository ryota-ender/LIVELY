"use client";

import { useState } from "react";

import { JAPAN_VIEW_BOX, PREFECTURE_SHAPES } from "@/lib/japan-map";

import { LEVEL_FILLS, LEVEL_LABELS, countLevel } from "./mapScale";

type Hover = { code: string; x: number; y: number };

export function JapanMap({
  counts,
  selectedCode,
  onSelect,
}: {
  counts: Record<string, number>;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const [hover, setHover] = useState<Hover | null>(null);

  const hovered = hover ? PREFECTURE_SHAPES.find((p) => p.code === hover.code) : null;

  return (
    <div className="relative">
      <svg
        viewBox={JAPAN_VIEW_BOX}
        role="img"
        aria-label="都道府県別の参戦マップ"
        className="h-auto w-full max-w-2xl mx-auto"
        onMouseLeave={() => setHover(null)}
      >
        {/* 沖縄の枠（実際の位置ではなく左下に配置しているため） */}
        <rect
          x="8"
          y="404"
          width="152"
          height="104"
          rx="8"
          fill="none"
          stroke="#2e2350"
          strokeWidth="1.5"
        />

        {PREFECTURE_SHAPES.map((pref) => {
          const count = counts[pref.code] ?? 0;
          const level = countLevel(count);
          const isSelected = selectedCode === pref.code;
          const isHovered = hover?.code === pref.code;

          return (
            <path
              key={pref.code}
              d={pref.path}
              fill={LEVEL_FILLS[level]}
              stroke={isSelected ? "#34e0e8" : "#0d0819"}
              strokeWidth={isSelected ? 2.4 : 0.8}
              vectorEffect="non-scaling-stroke"
              tabIndex={0}
              role="button"
              aria-label={`${pref.name} ${count} 回`}
              aria-pressed={isSelected}
              className="cursor-pointer outline-none transition-[opacity,filter]"
              style={{
                opacity: isHovered ? 0.85 : 1,
                filter: isSelected ? "drop-shadow(0 0 6px rgba(52,224,232,0.9))" : undefined,
              }}
              onClick={() => onSelect(pref.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(pref.code);
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!rect) return;
                setHover({
                  code: pref.code,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
              onFocus={() => setHover({ code: pref.code, x: 0, y: 0 })}
              onBlur={() => setHover(null)}
            />
          );
        })}
      </svg>

      {hovered && hover ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-lg border border-line bg-ink/95 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="font-bold">{hovered.name}</span>
          <span className="ml-2 text-neon-pink">{counts[hovered.code] ?? 0} 回</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {LEVEL_FILLS.map((fill, level) => (
          <span key={fill} className="flex items-center gap-1.5 text-[0.65rem] text-muted">
            <span
              className="inline-block h-3 w-3 rounded-sm ring-1 ring-black/40"
              style={{ backgroundColor: fill }}
            />
            {LEVEL_LABELS[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
