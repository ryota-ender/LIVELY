import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseEnv } from "@/lib/supabase/env";

/** ログインしていないと開けないパス */
const PROTECTED_PREFIXES = ["/lives", "/artists", "/map", "/stats"];
/** ログイン済みなら一覧に飛ばすパス */
const AUTH_PAGES = ["/login", "/signup"];

/**
 * リクエストのたびに Supabase のセッション Cookie を更新し、
 * 未ログイン / ログイン済みのアクセス先を振り分ける。
 */
export async function proxy(request: NextRequest) {
  // 環境変数が未設定のときは何もしない（セットアップ前でも画面は開ける）
  if (!hasSupabaseEnv) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 認証 Cookie を含むレスポンスが CDN にキャッシュされないようにする
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/lives";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 静的アセットと画像最適化以外のすべてのパスで実行する
     */
    "/((?!_next/static|_next/image|icons/|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
