"use client";

import { useActionState, useEffect, useRef } from "react";

import { deleteLive } from "@/app/(app)/lives/actions";
import { INITIAL_LIVE_FORM_STATE } from "@/lib/live-form-state";
import type { LiveWithImage } from "@/lib/types";

export function DeleteLiveForm({
  live,
  onDeleted,
  onCancel,
}: {
  live: LiveWithImage;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(deleteLive, INITIAL_LIVE_FORM_STATE);

  const doneRef = useRef(false);
  useEffect(() => {
    if (state.submitted > 0 && state.ok && !doneRef.current) {
      doneRef.current = true;
      onDeleted();
    }
  }, [state, onDeleted]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={live.id} />

      {state.error ? (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <p className="text-sm">このライブの記録を削除しますか？</p>
      <p className="mt-3 rounded-lg border border-line bg-ink/50 px-3 py-2 text-sm">
        <span className="font-bold text-neon-cyan">{live.artist_name}</span>
        <br />
        {live.live_title}
        <br />
        <span className="text-xs text-faint">{live.live_date}</span>
      </p>
      <p className="mt-3 text-xs text-muted">削除すると元に戻せません。</p>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={pending}>
          いいえ
        </button>
        <button type="submit" className="btn btn-danger" disabled={pending}>
          {pending ? "削除中…" : "削除する"}
        </button>
      </div>
    </form>
  );
}
