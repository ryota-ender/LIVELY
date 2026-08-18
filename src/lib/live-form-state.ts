/** ライブ登録 / 編集フォームの状態（useActionState 用） */
export type LiveFormState = {
  /** 送信のたびに増やして、成功を検知できるようにする */
  submitted: number;
  ok: boolean;
  error?: string;
};

export const INITIAL_LIVE_FORM_STATE: LiveFormState = { submitted: 0, ok: false };

/** カンマ・読点区切りの文字列をアーティスト名の配列にする */
export function parseCoArtists(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,、，]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}
