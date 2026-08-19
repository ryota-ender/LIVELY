import { todayInTokyo } from "@/lib/format";
import { loadLives } from "@/lib/lives";
import { prefectureName } from "@/lib/prefectures";
import {
  parseSharePeriod,
  periodLabel,
  scopeLabel,
  selectForShare,
  sharePageCount,
  sliceForPage,
  toShareRows,
} from "@/lib/share-image";
import { getCurrentUser } from "@/lib/supabase/server";

import { renderShareImage } from "./render";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const today = todayInTokyo();
  const params = new URL(request.url).searchParams;
  const period = parseSharePeriod(params, today.slice(0, 4));
  const page = Number(params.get("page") ?? "1") === 2 ? 2 : 1;

  const result = await loadLives();
  if (!result.ok) return new Response(result.message, { status: 500 });

  const lives = selectForShare(result.data, period, today);
  const pageCount = sharePageCount(lives.length);
  const rows = toShareRows(sliceForPage(lives, page), prefectureName);

  return renderShareImage({
    title: periodLabel(period),
    badge: scopeLabel(period.scope),
    rows,
    total: lives.length,
    page,
    pageCount,
  });
}
