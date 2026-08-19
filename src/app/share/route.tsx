import { todayInTokyo } from "@/lib/format";
import { loadLives } from "@/lib/lives";
import { prefectureName } from "@/lib/prefectures";
import {
  parseSharePeriod,
  periodLabel,
  scopeLabel,
  selectForShare,
  toShareRows,
} from "@/lib/share-image";
import { getCurrentUser } from "@/lib/supabase/server";

import { MAX_ROWS, renderShareImage } from "./render";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const today = todayInTokyo();
  const params = new URL(request.url).searchParams;
  const period = parseSharePeriod(params, today.slice(0, 4));

  const result = await loadLives();
  if (!result.ok) return new Response(result.message, { status: 500 });

  const lives = selectForShare(result.data, period, today);
  const rows = toShareRows(lives.slice(0, MAX_ROWS), prefectureName);

  return renderShareImage({
    title: periodLabel(period),
    badge: scopeLabel(period.scope),
    rows,
    total: lives.length,
    overflow: lives.length - rows.length,
    prefectures: new Set(lives.map((l) => l.prefecture_code).filter(Boolean)).size,
    artists: new Set(lives.flatMap((l) => [l.artist_name, ...l.co_artists])).size,
  });
}
