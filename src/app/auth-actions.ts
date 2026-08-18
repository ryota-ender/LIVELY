"use server";

import { redirect } from "next/navigation";

import type { AuthState } from "@/lib/auth-state";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/lives");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは 8 文字以上にしてください。" };
  }
  if (password !== passwordConfirm) {
    return { error: "パスワードが一致しません。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // メール確認が有効な場合はセッションが発行されない
  if (!data.session) {
    return {
      notice: `${email} に確認メールを送信しました。メール内のリンクを開いてからログインしてください。`,
    };
  }

  redirect("/lives");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Supabase から返る英語のエラーメッセージを日本語にする */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (m.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。確認メールのリンクを開いてください。";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "このメールアドレスは既に登録されています。";
  }
  if (m.includes("password should be at least")) {
    return "パスワードが短すぎます。8 文字以上にしてください。";
  }
  if (m.includes("unable to validate email address") || m.includes("invalid email")) {
    return "メールアドレスの形式が正しくありません。";
  }
  if (m.includes("email rate limit") || m.includes("too many requests")) {
    return "リクエストが多すぎます。しばらく待ってからもう一度お試しください。";
  }
  return `エラーが発生しました: ${message}`;
}
