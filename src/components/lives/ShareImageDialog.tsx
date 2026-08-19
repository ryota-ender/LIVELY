"use client";

import { useMemo, useState } from "react";

import { Modal } from "@/components/Modal";
import { ShareIcon } from "@/components/icons";
import type { ShareScope } from "@/lib/share-image";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const SCOPES: Array<{ key: ShareScope; label: string }> = [
  { key: "past", label: "参戦履歴" },
  { key: "upcoming", label: "参戦予定" },
];

export function ShareImageDialog({
  open,
  onClose,
  years,
  defaultYear,
}: {
  open: boolean;
  onClose: () => void;
  /** 選べる年（登録済みのもの） */
  years: string[];
  defaultYear: string;
}) {
  const [scope, setScope] = useState<ShareScope>("past");
  const [year, setYear] = useState(defaultYear);
  // 空 = 1 年分。from だけ選ぶと 1 か月分、to も変えると範囲になる
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams({ scope, year });
    if (fromMonth) {
      params.set("from", fromMonth);
      params.set("to", toMonth || fromMonth);
    }
    return `/share?${params.toString()}`;
  }, [scope, year, fromMonth, toMonth]);

  const fileName = [
    "lively",
    scope,
    year,
    fromMonth ? fromMonth.padStart(2, "0") : null,
    fromMonth && toMonth && toMonth !== fromMonth ? toMonth.padStart(2, "0") : null,
  ]
    .filter(Boolean)
    .join("-")
    .concat(".png");

  /** 開始月を変えたら、終了月がそれより前にならないように合わせる */
  const changeFromMonth = (value: string) => {
    setFromMonth(value);
    if (!value) setToMonth("");
    else if (!toMonth || Number(toMonth) < Number(value)) setToMonth(value);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("画像の生成に失敗しました");
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      // スマホでは共有シートを開く。使えない環境ではダウンロードする
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
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
          <span className="field-label">種別</span>
          <div className="flex rounded-xl border border-line bg-ink/40 p-0.5">
            {SCOPES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setScope(item.key)}
                aria-pressed={scope === item.key}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  scope === item.key ? "bg-white/10 text-text" : "text-faint hover:text-text"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
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
          <div>
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

        <div className="overflow-hidden rounded-xl border border-line bg-ink/60">
          {/* 生成した PNG をそのまま表示する（next/image の最適化は不要） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={url}
            src={url}
            alt="書き出す画像のプレビュー"
            className="h-auto w-full"
          />
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
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <ShareIcon className="h-4 w-4" />
            {saving ? "書き出し中…" : "保存・共有"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
