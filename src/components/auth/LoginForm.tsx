"use client";

import { useActionState } from "react";

import { signIn } from "@/app/auth-actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth-state";

import { FormMessage } from "./FormMessage";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL_AUTH_STATE);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

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
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
