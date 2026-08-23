"use client";

import { useActionState, useEffect, useRef } from "react";

import { clearArtistSettings, saveArtistSettings } from "@/app/(app)/artists/actions";
import type { ArtistSummary } from "@/lib/artists";
import { INITIAL_LIVE_FORM_STATE } from "@/lib/live-form-state";

export function ArtistSettingsForm({
  artist,
  onSaved,
  onCancel,
}: {
  artist: ArtistSummary;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(saveArtistSettings, INITIAL_LIVE_FORM_STATE);
  const [clearState, clearAction, clearing] = useActionState(
    clearArtistSettings,
    INITIAL_LIVE_FORM_STATE,
  );

  const doneRef = useRef(false);
  useEffect(() => {
    const latest = state.submitted >= clearState.submitted ? state : clearState;
    if (latest.submitted > 0 && latest.ok && !doneRef.current) {
      doneRef.current = true;
      onSaved();
    }
  }, [state, clearState, onSaved]);

  const error = state.error ?? clearState.error;

  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="name" value={artist.name} />

        <div>
          <label className="field-label" htmlFor="fanSince">
            応援開始日
          </label>
          <input
            id="fanSince"
            name="fanSince"
            type="date"
            className="field"
            defaultValue={artist.settings?.fan_since ?? ""}
          />
          <p className="mt-1 text-[0.65rem] text-faint">
            設定すると「応援して〇日目」が一覧に出ます。
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="url">
            リンク <span className="font-normal text-faint">（公式サイトや SNS）</span>
          </label>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            className="field"
            placeholder="https://example.com"
            defaultValue={artist.settings?.url ?? ""}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="artistMemo">
            メモ
          </label>
          <textarea
            id="artistMemo"
            name="memo"
            rows={4}
            className="field resize-y"
            placeholder="出会ったきっかけ、好きな曲など"
            defaultValue={artist.settings?.memo ?? ""}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={pending || clearing}
          >
            キャンセル
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending || clearing}>
            {pending ? "保存中…" : "保存する"}
          </button>
        </div>
      </form>

      {artist.settings ? (
        <form action={clearAction} className="border-t border-line-soft pt-3">
          <input type="hidden" name="name" value={artist.name} />
          <button type="submit" className="btn btn-danger w-full text-xs" disabled={clearing}>
            {clearing ? "削除中…" : "この設定を削除する（ライブ記録は残ります）"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
