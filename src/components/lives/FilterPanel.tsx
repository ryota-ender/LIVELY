"use client";

import Link from "next/link";
import { useState } from "react";

import { buildQuery, hasActiveFilters, type LiveFilters, type SortKey } from "@/lib/filters";
import { prefecturesByRegion } from "@/lib/prefectures";
import { LIVE_TYPES, LIVE_TYPE_LABELS } from "@/lib/types";

import { ChevronDownIcon, FilterIcon } from "../icons";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "desc", label: "新しい順" },
  { key: "asc", label: "古い順" },
  { key: "artist", label: "アーティスト順" },
];

export function FilterPanel({
  filters,
  artists,
  years,
  resultCount,
}: {
  filters: LiveFilters;
  artists: string[];
  years: string[];
  resultCount: number;
}) {
  const active = hasActiveFilters(filters);
  const [open, setOpen] = useState(active);

  return (
    <div className="panel mb-4">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="btn btn-ghost px-3 py-1.5 text-xs"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          絞り込み
          {active ? (
            <span
              aria-label="絞り込み中"
              className="h-1.5 w-1.5 rounded-full bg-neon-pink"
            />
          ) : null}
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <span className="text-xs text-faint">{resultCount} 件</span>

        <div className="ml-auto flex flex-wrap gap-1">
          {SORTS.map((sort) => (
            <Link
              key={sort.key}
              href={`/lives${buildQuery({ ...filters, sort: sort.key })}`}
              scroll={false}
              className={`rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold transition ${
                filters.sort === sort.key
                  ? "bg-white/10 text-text ring-1 ring-neon-violet/50"
                  : "text-faint hover:bg-white/5 hover:text-text"
              }`}
            >
              {sort.label}
            </Link>
          ))}
        </div>
      </div>

      {open ? (
        <form
          action="/lives"
          method="get"
          className="grid gap-3 border-t border-line-soft px-4 py-4 sm:grid-cols-3"
        >
          <input type="hidden" name="sort" value={filters.sort} />

          <div>
            <label className="field-label" htmlFor="f-artist">
              アーティスト
            </label>
            <select id="f-artist" name="artist" defaultValue={filters.artist} className="field">
              <option value="">すべて</option>
              {artists.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="f-status">
              開催状況
            </label>
            <select id="f-status" name="status" defaultValue={filters.status} className="field">
              <option value="upcoming">参戦予定</option>
              <option value="past">参戦済み</option>
              <option value="all">すべて</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="f-type">
              種別
            </label>
            <select id="f-type" name="type" defaultValue={filters.type} className="field">
              <option value="">すべて</option>
              {LIVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {LIVE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="f-pref">
              都道府県
            </label>
            <select id="f-pref" name="pref" defaultValue={filters.prefecture} className="field">
              <option value="">すべて</option>
              {prefecturesByRegion().map(({ region, prefectures }) => (
                <optgroup key={region} label={region}>
                  {prefectures.map((pref) => (
                    <option key={pref.code} value={pref.code}>
                      {pref.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="f-year">
              年
            </label>
            <select id="f-year" name="year" defaultValue={filters.year} className="field">
              <option value="">すべて</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="f-month">
              月
            </label>
            <select id="f-month" name="month" defaultValue={filters.month} className="field">
              <option value="">すべて</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="btn btn-primary flex-1">
              この条件で絞り込む
            </button>
            <Link href="/lives" className="btn btn-ghost">
              クリア
            </Link>
          </div>
        </form>
      ) : null}
    </div>
  );
}
