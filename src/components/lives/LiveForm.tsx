"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";

import { createLive, updateLive } from "@/app/(app)/lives/actions";
import { INITIAL_LIVE_FORM_STATE } from "@/lib/live-form-state";
import { IMAGE_BUCKET } from "@/lib/storage";
import { toTimeInputValue } from "@/lib/format";
import { prefecturesByRegion } from "@/lib/prefectures";
import { createClient } from "@/lib/supabase/client";
import { LIVE_TYPES, LIVE_TYPE_LABELS, type LiveWithImage } from "@/lib/types";

import { ArtistFields } from "./ArtistFields";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function LiveForm({
  live,
  onSaved,
  onCancel,
  /** 同じアーティスト・日付の登録が既にあるかを判定する（新規登録時のみ使用） */
  isDuplicate,
  /** 入力候補（表記ゆれを防ぐため、過去に入力した名前を提示する） */
  artistOptions = [],
  venueOptions = [],
}: {
  live?: LiveWithImage;
  onSaved: () => void;
  onCancel: () => void;
  isDuplicate?: (artistName: string, liveDate: string) => boolean;
  artistOptions?: string[];
  venueOptions?: string[];
}) {
  const isEdit = Boolean(live);
  const uid = useId();
  const artistListId = `artists-${uid}`;
  const venueListId = `venues-${uid}`;
  const [state, action, pending] = useActionState(
    isEdit ? updateLive : createLive,
    INITIAL_LIVE_FORM_STATE,
  );

  const formRef = useRef<HTMLFormElement>(null);

  // 画像はフォーム送信前に Storage へ直接アップロードし、パスだけを送る
  const [imagePath, setImagePath] = useState<string | null>(live?.image_path ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(live?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  /** 保存されないまま残ったアップロード済み画像（キャンセル時に消す） */
  const orphanPaths = useRef<string[]>([]);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const confirmedRef = useRef(false);

  const savedRef = useRef(false);
  useEffect(() => {
    if (state.submitted > 0 && state.ok && !savedRef.current) {
      savedRef.current = true;
      orphanPaths.current = [];
      onSaved();
    }
  }, [state, onSaved]);

  /** 保存せずに閉じたときは、アップロード済みの画像を消してゴミを残さない */
  const removeOrphans = useCallback(async () => {
    const targets = orphanPaths.current;
    if (targets.length === 0) return;
    orphanPaths.current = [];
    try {
      await createClient().storage.from(IMAGE_BUCKET).remove(targets);
    } catch {
      // 消せなくても致命的ではないので無視する
    }
  }, []);

  const handleCancel = () => {
    void removeOrphans();
    onCancel();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("画像は 5MB 以内にしてください。");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインし直してください。");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;

      orphanPaths.current.push(path);
      setImagePath(path);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "画像のアップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePath(null);
    setPreviewUrl(null);
    setImageError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isEdit || confirmedRef.current || !isDuplicate) return;

    const form = e.currentTarget;
    const artist = (form.elements.namedItem("artistName") as HTMLInputElement)?.value.trim() ?? "";
    const date = (form.elements.namedItem("liveDate") as HTMLInputElement)?.value ?? "";

    if (artist && date && isDuplicate(artist, date)) {
      e.preventDefault();
      setDuplicateWarning(`${artist}（${date}）`);
    }
  };

  const confirmDuplicate = () => {
    confirmedRef.current = true;
    setDuplicateWarning(null);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="space-y-4">
        {isEdit ? <input type="hidden" name="id" value={live!.id} /> : null}
        <input type="hidden" name="imagePath" value={imagePath ?? ""} />

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300"
          >
            {state.error}
          </p>
        ) : null}

        <ArtistFields
          defaultArtists={live ? [live.artist_name, ...live.co_artists] : []}
          options={artistOptions}
          listId={artistListId}
        />

        <div>
          <label className="field-label" htmlFor="liveTitle">
            ライブタイトル<span className="text-neon-pink">*</span>
          </label>
          <input
            id="liveTitle"
            name="liveTitle"
            className="field"
            required
            maxLength={150}
            defaultValue={live?.live_title ?? ""}
            placeholder="例：TOUR 2026"
          />
        </div>

        {/* 日付・時刻の入力欄は端末の UI に最低幅があるため、狭い画面では縦に並べる */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="field-label" htmlFor="liveDate">
              開催日<span className="text-neon-pink">*</span>
            </label>
            <input
              id="liveDate"
              name="liveDate"
              type="date"
              className="field"
              required
              defaultValue={live?.live_date ?? ""}
            />
          </div>
          <div className="min-w-0">
            <label className="field-label" htmlFor="liveType">
              種別
            </label>
            <select
              id="liveType"
              name="liveType"
              className="field"
              defaultValue={live?.live_type ?? ""}
            >
              <option value="">未設定</option>
              {LIVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {LIVE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="field-label" htmlFor="openTime">
              開場時間
            </label>
            <input
              id="openTime"
              name="openTime"
              type="time"
              className="field"
              defaultValue={toTimeInputValue(live?.open_time)}
            />
          </div>
          <div className="min-w-0">
            <label className="field-label" htmlFor="startTime">
              開演時間
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              className="field"
              defaultValue={toTimeInputValue(live?.start_time)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="prefectureCode">
            都道府県 <span className="font-normal text-faint">（制覇マップに反映されます）</span>
          </label>
          <select
            id="prefectureCode"
            name="prefectureCode"
            className="field"
            defaultValue={live?.prefecture_code ?? ""}
          >
            <option value="">未設定</option>
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
          <label className="field-label" htmlFor="venue">
            会場
          </label>
          <input
            id="venue"
            name="venue"
            className="field"
            maxLength={150}
            list={venueOptions.length > 0 ? venueListId : undefined}
            autoComplete="off"
            defaultValue={live?.venue ?? ""}
            placeholder="例：Zepp Tokyo"
          />
          {venueOptions.length > 0 ? (
            <datalist id={venueListId}>
              {venueOptions.map((venue) => (
                <option key={venue} value={venue} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div>
          <span className="field-label">画像（チケット・フライヤーなど）</span>
          {previewUrl ? (
            <div className="mb-2 overflow-hidden rounded-xl border border-line">
              {/* Storage の署名付き URL はリクエストごとに変わるため next/image は使わない */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="h-40 w-full object-cover" />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <label className="btn btn-ghost cursor-pointer text-xs">
              {uploading ? "アップロード中…" : previewUrl ? "画像を変更" : "画像を選択"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
            {previewUrl ? (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn btn-ghost text-xs text-muted"
              >
                画像を削除
              </button>
            ) : null}
          </div>

          {imageError ? <p className="mt-1 text-xs text-red-300">{imageError}</p> : null}
        </div>

        <div>
          <label className="field-label" htmlFor="memo">
            メモ
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={3}
            className="field resize-y"
            defaultValue={live?.memo ?? ""}
            placeholder="座席、同行者、感想など"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="setlist">
            セットリスト <span className="font-normal text-faint">（開催後に追記でも OK）</span>
          </label>
          <textarea
            id="setlist"
            name="setlist"
            rows={5}
            className="field resize-y font-mono text-xs"
            defaultValue={live?.setlist ?? ""}
            placeholder={"1. 〇〇\n2. △△\n3. …"}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={pending}>
            キャンセル
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending || uploading}>
            {pending ? "保存中…" : isEdit ? "更新する" : "登録する"}
          </button>
        </div>
      </form>

      {duplicateWarning ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDuplicateWarning(null)}
            aria-hidden
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl"
          >
            <h3 className="text-base font-bold">重複登録の確認</h3>
            <p className="mt-3 text-sm text-muted">
              同じアーティスト・日付のライブが既に登録されています。
            </p>
            <p className="mt-1 text-sm font-semibold">{duplicateWarning}</p>
            <p className="mt-3 text-sm">それでも登録しますか？</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDuplicateWarning(null)}
              >
                いいえ
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmDuplicate}>
                はい、登録する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
