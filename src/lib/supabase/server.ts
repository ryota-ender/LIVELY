import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

/**
 * Server Component / Server Action 用の Supabase クライアント。
 * セッションは Cookie で受け渡す。
 */
export async function createClient() {
  // cookies() を先に読むことで、このリクエストが動的レンダリングであることを Next.js に伝える
  const cookieStore = await cookies();
  assertSupabaseEnv();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは Cookie を書き込めない。
          // セッションの更新は proxy.ts が担当するため、ここでは無視してよい。
        }
      },
    },
  });
}

/**
 * ログイン中のユーザーを取得する。未ログインなら null。
 * （getUser() は Supabase の認証サーバーにトークンを検証させるため、
 *   Cookie を信用せずに済む）
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** ユーザーの表示名（設定されていなければメールアドレスのローカル部） */
export function displayNameOf(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return "";
  const name = user.user_metadata?.display_name;
  if (typeof name === "string" && name.trim() !== "") return name.trim();
  return user.email?.split("@")[0] ?? "";
}
