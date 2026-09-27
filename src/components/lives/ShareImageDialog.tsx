"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { ShareIcon } from "@/components/icons";
import {
  countForShare,
  shareArtists,
  sharePageCount,
  shareTargetParams,
  shareTours,
  type ShareIndexEntry,
  type ShareScope,
  type ShareTarget,
} from "@/lib/share-image";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type Mode = ShareTarget["kind"];

const MODES: Array<{ key: Mode; label: string }> = [
  { key: "period", label: "期間" },
  { key: "artist", label: "アーティスト" },
  { key: "tour", label: "ツアー" },
];

const SCOPES: Array<{ key: ShareScope; label: string }> = [
  { key: "past", label: "参戦履歴" },
  { key: "upcoming", label: "参戦予定" },
  { key: "all", label: "すべて" },
];

/** 選んだタブの見た目をそろえる */
function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<{ key: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-xl border border-line bg-ink/40 p-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={value === item.key}
          className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            value === item.key ? "bg-white/10 text-text" : "text-faint hover:text-text"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** ファイル名に使えない文字を置き換える */
const safeName = (value: string) => value.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);

export function ShareImageDialog({
  open,
  onClose,
  years,
  defaultYear,
  index,
}: {
  open: boolean;
  onClose: () => void;
  /** 選べる年（登録済みのもの） */
  years: string[];
  defaultYear: string;
  /** 件数を数えるための最小限の一覧 */
  index: ShareIndexEntry[];
}) {
  const [mode, setMode] = useState<Mode>("period");
  // 期間は過去か未来のどちらか。アーティスト・ツアーは両方をまとめて出すのが既定
  const [periodScope, setPeriodScope] = useState<ShareScope>("past");
  const [groupScope, setGroupScope] = useState<ShareScope>("all");
  const [year, setYear] = useState(defaultYear);
  // 空 = 1 年分。from だけ選ぶと 1 か月分、to も変えると範囲になる
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  const artists = useMemo(() => shareArtists(index), [index]);
  const [artist, setArtist] = useState(() => artists[0]?.name ?? "");
  // 空 = 全期間
  const [artistYear, setArtistYear] = useState("");
  const tours = useMemo(() => shareTours(index, artist), [index, artist]);
  const [tourPick, setTourPick] = useState("");
  // アーティストを変えたら、そのアーティストの最新のツアーを選び直す
  const tour = tours.some((t) => t.name === tourPick) ? tourPick : (tours[0]?.name ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target: ShareTarget = useMemo(() => {
    if (mode === "artist") {
      return { kind: "artist", artist, scope: groupScope, year: artistYear || null };
    }
    if (mode === "tour") return { kind: "tour", artist, tour, scope: groupScope };
    return {
      kind: "period",
      scope: periodScope,
      year,
      fromMonth: fromMonth ? Number(fromMonth) : null,
      toMonth: fromMonth ? Number(toMonth || fromMonth) : null,
    };
  }, [mode, artist, artistYear, tour, groupScope, periodScope, year, fromMonth, toMonth]);

  const { urls, count } = useMemo(() => {
    const matched = countForShare(index, target);
    const params = shareTargetParams(target);

    // 件数が多いと 1 枚が縦に長くなりすぎるので 2 枚に分ける
    const pages = sharePageCount(matched);
    return {
      count: matched,
      urls: Array.from({ length: pages }, (_, i) => {
        const p = new URLSearchParams(params);
        if (pages > 1) p.set("page", String(i + 1));
        return `/share?${p.toString()}`;
      }),
    };
  }, [index, target]);

  const baseName = ["lively", target.scope]
    .concat(
      target.kind === "period"
        ? [
            target.year,
            fromMonth ? fromMonth.padStart(2, "0") : "",
            fromMonth && toMonth && toMonth !== fromMonth ? toMonth.padStart(2, "0") : "",
          ]
        : target.kind === "artist"
          ? [safeName(target.artist), target.year ?? ""]
          : [safeName(target.artist), safeName(target.tour)],
    )
    .filter(Boolean)
    .join("-");

  const fileNameFor = (i: number) =>
    urls.length > 1 ? `${baseName}-${i + 1}.png` : `${baseName}.png`;

  /** 開始月を変えたら、終了月がそれより前にならないように合わせる */
  const changeFromMonth = (value: string) => {
    setFromMonth(value);
    if (!value) setToMonth("");
    else if (!toMonth || Number(toMonth) < Number(value)) setToMonth(value);
  };

  const handleSave = async () => {
    if (count === 0) return;
    setSaving(true);
    setError(null);
    try {
      const files = await Promise.all(
        urls.map(async (u, i) => {
          const response = await fetch(u);
          if (!response.ok) throw new Error("画像の生成に失敗しました");
          return new File([await response.blob()], fileNameFor(i), { type: "image/png" });
        }),
      );

      // スマホでは共有シートを開く。使えない環境ではダウンロードする
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files });
        return;
      }

      for (const file of files) {
        const objectUrl = URL.createObjectURL(file);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = file.name;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      // 共有シートを閉じただけの場合はエラー扱いしない
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="画像で書き出す" wide>
      <div className="space-y-4">
        <div>
          <span className="field-label">書き出す単位</span>
          <Segmented items={MODES} value={mode} onChange={setMode} label="書き出す単位" />
        </div>

        <div>
          <span className="field-label">種別</span>
          {mode === "period" ? (
            <Segmented
              items={SCOPES.filter((item) => item.key !== "all")}
              value={periodScope}
              onChange={setPeriodScope}
              label="種別"
            />
          ) : (
            <Segmented items={SCOPES} value={groupScope} onChange={setGroupScope} label="種別" />
          )}
        </div>

        {mode === "period" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="field-label" htmlFor="share-year">
                年
              </label>
              <select
                id="share-year"
                className="field"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="field-label" htmlFor="share-from">
                月
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  id="share-from"
                  className="field"
                  value={fromMonth}
                  onChange={(e) => changeFromMonth(e.target.value)}
                >
                  <option value="">1 年分</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
                <span aria-hidden className="shrink-0 text-xs text-faint">
                  〜
                </span>
                <select
                  aria-label="終了月"
                  className="field"
                  value={toMonth}
                  disabled={!fromMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                >
                  {fromMonth ? (
                    MONTHS.filter((m) => m >= Number(fromMonth)).map((m) => (
                      <option key={m} value={m}>
                        {m}月
                      </option>
                    ))
                  ) : (
                    <option value="">—</option>
                  )}
                </select>
              </div>
              <p className="mt-1 text-[0.65rem] text-faint">
                同じ月を選べば 1 か月分になります。
              </p>
            </div>
          </div>
        ) : artists.length === 0 ? (
          <p className="text-xs text-muted">ライブを登録すると選べるようになります。</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="field-label" htmlFor="share-artist">
                アーティスト
              </label>
              <select
                id="share-artist"
                className="field"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              >
                {artists.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}（{a.count}本）
                  </option>
                ))}
              </select>
            </div>
            {mode === "artist" ? (
              <div className="min-w-0">
                <label className="field-label" htmlFor="share-artist-year">
                  年
                </label>
                <select
                  id="share-artist-year"
                  className="field"
                  value={artistYear}
                  onChange={(e) => setArtistYear(e.target.value)}
                >
                  <option value="">全期間</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="min-w-0">
                <label className="field-label" htmlFor="share-tour">
                  ツアー <span className="font-normal text-faint">（同じライブタイトル）</span>
                </label>
                <select
                  id="share-tour"
                  className="field"
                  value={tour}
                  onChange={(e) => setTourPick(e.target.value)}
                >
                  {tours.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}（{t.count}本）
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-[0.65rem] text-faint sm:col-span-2">
              対バン・フェスで共演したライブも含みます。
            </p>
          </div>
        )}

        <p className="text-xs text-muted">
          {count} 件
          {urls.length > 1 ? (
            <span className="ml-2 text-faint">件数が多いので 2 枚に分けます</span>
          ) : null}
        </p>

        <div className="space-y-3">
          {urls.map((u, i) => (
            <div key={u} className="overflow-hidden rounded-xl border border-line bg-ink/60">
              {/* 生成した PNG をそのまま表示する（next/image の最適化は不要） */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`書き出す画像のプレビュー ${i + 1}`} className="h-auto w-full" />
            </div>
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            閉じる
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || count === 0}>
            <ShareIcon className="h-4 w-4" />
            {saving ? "書き出し中…" : urls.length > 1 ? "2 枚を保存・共有" : "保存・共有"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
