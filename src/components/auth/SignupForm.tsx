"use client";

import { useActionState } from "react";

import { signUp } from "@/app/auth-actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth-state";

import { FormMessage } from "./FormMessage";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, INITIAL_AUTH_STATE);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label className="field-label" htmlFor="displayName">
          ニックネーム <span className="font-normal text-faint">（任意）</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          maxLength={30}
          className="field"
          placeholder="ライブ好き"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          パスワード <span className="font-normal text-faint">（8 文字以上）</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="passwordConfirm">
          パスワード（確認）
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "作成中…" : "アカウントを作成"}
      </button>
    </form>
  );
}
