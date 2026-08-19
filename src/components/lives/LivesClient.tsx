"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { Modal } from "@/components/Modal";
import { ImageIcon, PlusIcon, TicketIcon } from "@/components/icons";
import type { LiveWithImage } from "@/lib/types";
import {
  getViewServerSnapshot,
  getViewSnapshot,
  setStoredView,
  subscribeView,
  type ViewMode,
} from "@/lib/view-preference";

import { CalendarView } from "./CalendarView";
import { LiveCard } from "./LiveCard";
import { LiveForm } from "./LiveForm";
import { ShareImageDialog } from "./ShareImageDialog";

export function LivesClient({
  lives,
  today,
  duplicatePairs,
  artistOptions,
  venueOptions,
  shareYears,
  emptyMessage,
}: {
  lives: LiveWithImage[];
  today: string;
  /** 重複登録チェック用の「アーティスト名|日付」一覧 */
  duplicatePairs: string[];
  /** 登録フォームの入力候補（表記ゆれ防止） */
  artistOptions: string[];
  venueOptions: string[];
  /** 画像書き出しで選べる年 */
  shareYears: string[];
  emptyMessage: string;
}) {
  const view = useSyncExternalStore(subscribeView, getViewSnapshot, getViewServerSnapshot);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const changeView = (next: ViewMode) => setStoredView(next);

  const closeCreate = useCallback(() => setCreating(false), []);
  const closeShare = useCallback(() => setSharing(false), []);

  const isDuplicate = useCallback(
    (artistName: string, liveDate: string) => duplicatePairs.includes(`${artistName}|${liveDate}`),
    [duplicatePairs],
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded-xl border border-line bg-surface/60 p-0.5">
          {(
            [
              { key: "list", label: "一覧" },
              { key: "calendar", label: "カレンダー" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => changeView(item.key)}
              aria-pressed={view === item.key}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                view === item.key ? "bg-white/10 text-text" : "text-faint hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSharing(true)}
          className="btn btn-ghost ml-auto"
          title="参戦履歴・参戦予定を画像で書き出す"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">画像で書き出す</span>
        </button>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn btn-primary hidden sm:inline-flex"
        >
          <PlusIcon className="h-4 w-4" />
          新規登録
        </button>
      </div>

      {view === "list" ? (
        lives.length === 0 ? (
          <div className="panel flex flex-col items-center px-6 py-14 text-center">
            <TicketIcon className="h-10 w-10 text-line" />
            <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn btn-primary mt-5"
            >
              <PlusIcon className="h-4 w-4" />
              ライブを登録する
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lives.map((live) => (
              <LiveCard key={live.id} live={live} today={today} />
            ))}
          </div>
        )
      ) : (
        <CalendarView lives={lives} today={today} />
      )}

      {/* スマホ用のフローティング登録ボタン */}
      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="ライブを新規登録"
        className="btn btn-primary fixed right-5 z-40 h-14 w-14 rounded-full !p-0 shadow-xl sm:hidden"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* 画像で書き出す */}
      <ShareImageDialog
        open={sharing}
        onClose={closeShare}
        years={shareYears}
        defaultYear={today.slice(0, 4)}
      />

      {/* 新規登録 */}
      <Modal open={creating} onClose={closeCreate} title="ライブを登録" wide>
        {creating ? (
          <LiveForm
            onSaved={closeCreate}
            onCancel={closeCreate}
            isDuplicate={isDuplicate}
            artistOptions={artistOptions}
            venueOptions={venueOptions}
          />
        ) : null}
      </Modal>
    </>
  );
}
