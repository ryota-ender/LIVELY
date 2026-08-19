import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

/**
 * Server Component / Server Action 用の Supabase クライアント。
 * セッションは Cookie で受け渡す。
 *
 * cache() で包んでいるので、同じリクエストの中で何度呼んでも
 * クライアントは 1 つだけ作られる。
 */
export const createClient = cache(async () => {
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
});

export type SessionUser = {
  id: string;
  email: string | null;
  /** 画面に出す名前。未設定ならメールアドレスのローカル部 */
  displayName: string;
};

/**
 * ログイン中のユーザーを取得する。未ログインなら null。
 *
 * getUser() ではなく getClaims() を使っているのは、アクセストークンの検証を
 * 毎回 Supabase の認証サーバーに問い合わせずに済ませるため。
 * プロジェクトが非対称鍵（ECC / RSA）で JWT を署名していれば、
 * 署名検証はサーバー内で完結し、画面遷移のたびの往復が 1 回減る。
 * （対称鍵のままの場合は getUser() と同じくサーバーに問い合わせるので、
 *   遅くなることはない）
 *
 * cache() により、同じリクエスト内での重複呼び出しは 1 回にまとまる。
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const email = typeof claims.email === "string" ? claims.email : null;
  const metadata = claims.user_metadata as Record<string, unknown> | undefined;
  const name = metadata?.display_name;

  return {
    id: claims.sub,
    email,
    displayName:
      typeof name === "string" && name.trim() !== ""
        ? name.trim()
        : (email?.split("@")[0] ?? ""),
  };
});
