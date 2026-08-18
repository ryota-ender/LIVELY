import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

/** ブラウザ（Client Component）用の Supabase クライアント */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
