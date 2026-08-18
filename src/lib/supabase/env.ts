/**
 * Supabase の接続情報。
 * `.env.local`（ローカル）／ Vercel の環境変数に設定してください。
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const hasSupabaseEnv = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";

export function assertSupabaseEnv(): void {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Supabase の環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください（README.md 参照）。",
    );
  }
}
