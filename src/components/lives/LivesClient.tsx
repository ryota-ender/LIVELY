"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { Modal } from "@/components/Modal";
import { PlusIcon, TicketIcon } from "@/components/icons";
import type { LiveWithImage } from "@/lib/types";
import {
  getViewServerSnapshot,
  getViewSnapshot,
  setStoredView,
  subscribeView,
  type ViewMode,
} from "@/lib/view-preference";

import { CalendarView } from "./CalendarView";
import { DeleteLiveForm } from "./DeleteLiveForm";
import { LiveCard } from "./LiveCard";
import { LiveDetail } from "./LiveDetail";
import { LiveForm } from "./LiveForm";

type ModalMode = "view" | "edit" | "delete";

export function LivesClient({
  lives,
  today,
  duplicatePairs,
  artistOptions,
  venueOptions,
  emptyMessage,
}: {
  lives: LiveWithImage[];
  today: string;
  /** 重複登録チェック用の「アーティスト名|日付」一覧 */
  duplicatePairs: string[];
  /** 登録フォームの入力候補（表記ゆれ防止） */
  artistOptions: string[];
  venueOptions: string[];
  emptyMessage: string;
}) {
  const view = useSyncExternalStore(subscribeView, getViewSnapshot, getViewServerSnapshot);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ModalMode>("view");
  const [creating, setCreating] = useState(false);

  const changeView = (next: ViewMode) => setStoredView(next);

  // 一覧が更新されると自動的に最新の内容になる（削除されたら null になり、モーダルが閉じる）
  const selected = selectedId ? (lives.find((l) => l.id === selectedId) ?? null) : null;

  const openDetail = (live: LiveWithImage) => {
    setSelectedId(live.id);
    setMode("view");
  };

  const closeModal = useCallback(() => setSelectedId(null), []);
  const closeCreate = useCallback(() => setCreating(false), []);

  const isDuplicate = useCallback(
    (artistName: string, liveDate: string) => duplicatePairs.includes(`${artistName}|${liveDate}`),
    [duplicatePairs],
  );

  const modalTitle =
    mode === "edit" ? "ライブを編集" : mode === "delete" ? "削除の確認" : "ライブの詳細";

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
          onClick={() => setCreating(true)}
          className="btn btn-primary ml-auto hidden sm:inline-flex"
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
              <LiveCard key={live.id} live={live} today={today} onClick={() => openDetail(live)} />
            ))}
          </div>
        )
      ) : (
        <CalendarView lives={lives} today={today} onSelect={openDetail} />
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

      {/* 詳細 / 編集 / 削除 */}
      <Modal
        open={selected !== null}
        onClose={closeModal}
        title={modalTitle}
        wide={mode !== "delete"}
        footer={
          selected && mode === "view" ? (
            <>
              <button
                type="button"
                className="btn btn-danger mr-auto"
                onClick={() => setMode("delete")}
              >
                削除
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                閉じる
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setMode("edit")}>
                編集
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          mode === "view" ? (
            <LiveDetail live={selected} today={today} />
          ) : mode === "edit" ? (
            <LiveForm
              live={selected}
              onSaved={closeModal}
              onCancel={() => setMode("view")}
              artistOptions={artistOptions}
              venueOptions={venueOptions}
            />
          ) : (
            <DeleteLiveForm
              live={selected}
              onDeleted={closeModal}
              onCancel={() => setMode("view")}
            />
          )
        ) : null}
      </Modal>

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
