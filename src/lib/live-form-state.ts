/** ライブ登録 / 編集フォームの状態（useActionState 用） */
export type LiveFormState = {
  /** 送信のたびに増やして、成功を検知できるようにする */
  submitted: number;
  ok: boolean;
  error?: string;
};

export const INITIAL_LIVE_FORM_STATE: LiveFormState = { submitted: 0, ok: false };
