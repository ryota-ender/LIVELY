"use client";

import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/Modal";
import type { LiveWithImage } from "@/lib/types";

import { CalendarView } from "./CalendarView";
import { DeleteLiveForm } from "./DeleteLiveForm";
import { LiveCard } from "./LiveCard";
import { LiveDetail } from "./LiveDetail";
import { LiveForm } from "./LiveForm";

type ViewMode = "list" | "calendar";
type ModalMode = "view" | "edit" | "delete";

const VIEW_STORAGE_KEY = "lively:view";

export function LivesClient({
  lives,
  today,
  duplicatePairs,
  emptyMessage,
}: {
  lives: LiveWithImage[];
  today: string;
  /** 重複登録チェック用の「アーティスト名|日付」一覧 */
  duplicatePairs: string[];
  emptyMessage: string;
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<LiveWithImage | null>(null);
  const [mode, setMode] = useState<ModalMode>("view");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "list" || saved === "calendar") setView(saved);
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  // 一覧が更新されたら、開いている詳細も最新の内容に差し替える
  useEffect(() => {
    setSelected((prev) => (prev ? (lives.find((l) => l.id === prev.id) ?? null) : null));
  }, [lives]);

  const openDetail = (live: LiveWithImage) => {
    setSelected(live);
    setMode("view");
  };

  const closeModal = useCallback(() => setSelected(null), []);
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
          ＋ 新規登録
        </button>
      </div>

      {view === "list" ? (
        lives.length === 0 ? (
          <div className="panel px-6 py-14 text-center">
            <p className="text-3xl">🎫</p>
            <p className="mt-3 text-sm text-muted">{emptyMessage}</p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn btn-primary mt-5"
            >
              ＋ ライブを登録する
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
        className="btn btn-primary fixed right-5 z-40 h-14 w-14 rounded-full !p-0 text-2xl shadow-xl sm:hidden"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        ＋
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
          <LiveForm onSaved={closeCreate} onCancel={closeCreate} isDuplicate={isDuplicate} />
        ) : null}
      </Modal>
    </>
  );
}
