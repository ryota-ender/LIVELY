import { allArtistsOf } from "./filters";
import { PREFECTURE_COUNT, PREFECTURES, prefecturesByRegion, type Region } from "./prefectures";
import { LIVE_TYPE_LABELS, type Live, type LiveType } from "./types";

export type CountEntry = { key: string; label: string; count: number };

/** 概要の数値 */
export function summarize(lives: Live[], today: string) {
  const attended = lives.filter((l) => l.live_date <= today).length;
  const upcoming = lives.length - attended;

  const prefCounts = countByPrefecture(lives);
  const conquered = Object.values(prefCounts).filter((n) => n > 0).length;

  return {
    total: lives.length,
    attended,
    upcoming,
    artists: new Set(lives.flatMap(allArtistsOf)).size,
    venues: new Set(lives.map((l) => l.venue?.trim()).filter(Boolean)).size,
    conquered,
    prefectureTotal: PREFECTURE_COUNT,
    conqueredRate: PREFECTURE_COUNT === 0 ? 0 : conquered / PREFECTURE_COUNT,
  };
}

/** 都道府県コード → 参戦数（未参戦は 0 で埋める） */
export function countByPrefecture(lives: Live[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pref of PREFECTURES) counts[pref.code] = 0;
  for (const live of lives) {
    if (live.prefecture_code && live.prefecture_code in counts) {
      counts[live.prefecture_code] += 1;
    }
  }
  return counts;
}

/** 地域ごとの制覇状況 */
export function countByRegion(
  lives: Live[],
): Array<{ region: Region; conquered: number; total: number; count: number }> {
  const prefCounts = countByPrefecture(lives);

  return prefecturesByRegion().map(({ region, prefectures }) => ({
    region,
    total: prefectures.length,
    conquered: prefectures.filter((p) => prefCounts[p.code] > 0).length,
    count: prefectures.reduce((sum, p) => sum + prefCounts[p.code], 0),
  }));
}

/** 年別の参戦数（古い順） */
export function countByYear(lives: Live[]): CountEntry[] {
  const map = new Map<string, number>();
  for (const live of lives) {
    const year = live.live_date.slice(0, 4);
    map.set(year, (map.get(year) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, label: `${key}年`, count }));
}

/** アーティスト別の参戦数（多い順）。共演アーティストも 1 回としてカウントする。 */
export function countByArtist(lives: Live[], limit = 20): CountEntry[] {
  const map = new Map<string, number>();
  for (const live of lives) {
    for (const artist of allArtistsOf(live)) {
      map.set(artist, (map.get(artist) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: key, count }));
}

/** 会場別の参戦数（多い順） */
export function countByVenue(lives: Live[], limit = 10): CountEntry[] {
  const map = new Map<string, number>();
  for (const live of lives) {
    const venue = live.venue?.trim();
    if (!venue) continue;
    map.set(venue, (map.get(venue) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: key, count }));
}

/** 種別ごとの参戦数 */
export function countByType(lives: Live[]): CountEntry[] {
  const map = new Map<string, number>();
  for (const live of lives) {
    const key = live.live_type ?? "";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: key ? LIVE_TYPE_LABELS[key as LiveType] : "未設定",
      count,
    }));
}

/** 今日以降で最も近いライブ */
export function nextLive<T extends Live>(lives: T[], today: string): T | null {
  const upcoming = lives
    .filter((l) => l.live_date >= today)
    .sort((a, b) => a.live_date.localeCompare(b.live_date));
  return upcoming[0] ?? null;
}
