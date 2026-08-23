import { allArtistsOf } from "./filters";
import { daysBetween } from "./format";
import type { Live } from "./types";

/** artists テーブルの 1 行（＝アーティストごとの設定） */
export type ArtistSettings = {
  id: string;
  user_id: string;
  name: string;
  /** 応援を始めた日（YYYY-MM-DD） */
  fan_since: string | null;
  memo: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

/** 一覧に出す 1 件分。設定とライブ記録から組み立てる */
export type ArtistSummary = {
  name: string;
  /** 設定が未登録なら null */
  settings: ArtistSettings | null;
  /** 応援開始からの日数（当日を 1 日目とする）。未設定なら null */
  fanDays: number | null;
  /** 初参戦日（開催済みのうち最も古い日）。未参戦なら null */
  firstLiveDate: string | null;
  /** 直近の参戦日 */
  lastLiveDate: string | null;
  /** これから参戦する最も近い日 */
  nextLiveDate: string | null;
  /** 参戦済みの回数 */
  attended: number;
  /** 参戦予定の本数 */
  upcoming: number;
};

/** 応援開始日から「何日目」を出す（開始日当日が 1 日目） */
export function fanDaysFrom(fanSince: string, today: string): number | null {
  const diff = daysBetween(fanSince, today);
  // 未来の日付が入っていたら数えない
  return diff < 0 ? null : diff + 1;
}

/**
 * ライブ記録と設定をアーティスト名でまとめる。
 * 設定だけあってライブがまだ無いアーティストも一覧に出す。
 */
export function buildArtistSummaries(
  lives: Live[],
  settings: ArtistSettings[],
  today: string,
): ArtistSummary[] {
  const byName = new Map<string, { attended: string[]; upcoming: string[] }>();

  const ensure = (name: string) => {
    let entry = byName.get(name);
    if (!entry) {
      entry = { attended: [], upcoming: [] };
      byName.set(name, entry);
    }
    return entry;
  };

  for (const live of lives) {
    for (const name of allArtistsOf(live)) {
      const entry = ensure(name);
      if (live.live_date <= today) entry.attended.push(live.live_date);
      else entry.upcoming.push(live.live_date);
    }
  }

  const settingsByName = new Map(settings.map((s) => [s.name, s]));
  for (const s of settings) ensure(s.name);

  return [...byName.entries()]
    .map(([name, dates]) => {
      const setting = settingsByName.get(name) ?? null;
      const attended = [...dates.attended].sort();
      const upcoming = [...dates.upcoming].sort();

      return {
        name,
        settings: setting,
        fanDays: setting?.fan_since ? fanDaysFrom(setting.fan_since, today) : null,
        firstLiveDate: attended[0] ?? null,
        lastLiveDate: attended.at(-1) ?? null,
        nextLiveDate: upcoming[0] ?? null,
        attended: attended.length,
        upcoming: upcoming.length,
      };
    })
    .sort(
      (a, b) =>
        b.attended + b.upcoming - (a.attended + a.upcoming) ||
        a.name.localeCompare(b.name, "ja"),
    );
}
