/** ログイン / アカウント作成フォームの状態（useActionState 用） */
export type AuthState = {
  error?: string;
  notice?: string;
};

export const INITIAL_AUTH_STATE: AuthState = {};
