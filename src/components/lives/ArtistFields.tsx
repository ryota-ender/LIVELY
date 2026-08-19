"use client";

import { useRef, useState } from "react";

import { CloseIcon, PlusIcon } from "../icons";

/**
 * アーティストの入力欄。既定は 1 行で、「アーティストを追加」で行が増える。
 *
 * 1 行目が name="artistName"（メインアーティスト）、
 * 2 行目以降が name="coArtists"（共演アーティスト）として送信される。
 * 同じ name の入力が複数あるので、サーバー側では formData.getAll("coArtists") で受け取る。
 */
export function ArtistFields({
  defaultArtists,
  options,
  listId,
}: {
  /** 編集時の初期値（[メイン, 共演...]） */
  defaultArtists: string[];
  /** 入力候補（登録済みのアーティスト名） */
  options: string[];
  listId: string;
}) {
  const seed = defaultArtists.length > 0 ? defaultArtists : [""];
  // サーバー描画とクライアントで同じ値になるよう、乱数ではなく連番を使う
  const nextId = useRef(seed.length);
  const [rows, setRows] = useState(() => seed.map((value, index) => ({ id: index, value })));

  const update = (id: number, value: string) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, value } : row)));

  const add = () => setRows((prev) => [...prev, { id: nextId.current++, value: "" }]);

  const remove = (id: number) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));

  return (
    <div>
      <span className="field-label">
        アーティスト<span className="text-neon-pink">*</span>{" "}
        <span className="font-normal text-faint">
          （対バン・フェスは「追加」で複数登録できます）
        </span>
      </span>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`w-9 shrink-0 text-center text-[0.6rem] font-bold ${
                index === 0 ? "text-neon-cyan" : "text-faint"
              }`}
            >
              {index === 0 ? "メイン" : "共演"}
            </span>

            <input
              name={index === 0 ? "artistName" : "coArtists"}
              value={row.value}
              onChange={(e) => update(row.id, e.target.value)}
              required={index === 0}
              maxLength={100}
              list={options.length > 0 ? listId : undefined}
              autoComplete="off"
              className="field"
              placeholder={index === 0 ? "例：ヨルシカ" : "例：ずっと真夜中でいいのに。"}
              aria-label={index === 0 ? "メインアーティスト" : `共演アーティスト ${index}`}
            />

            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(row.id)}
                aria-label={`${row.value || `${index + 1} 組目`}を削除`}
                className="btn btn-ghost shrink-0 p-2 text-faint"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="btn btn-ghost mt-2 w-full text-xs">
        <PlusIcon className="h-3.5 w-3.5" />
        アーティストを追加
      </button>

      {options.length > 0 ? (
        <>
          <datalist id={listId}>
            {options.map((artist) => (
              <option key={artist} value={artist} />
            ))}
          </datalist>
          <p className="mt-1.5 text-[0.65rem] text-faint">
            登録済みの名前が候補に出ます。表記を揃えると統計が正しく集計されます。
          </p>
        </>
      ) : null}
    </div>
  );
}
