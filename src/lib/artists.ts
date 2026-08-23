import { allArtistsOf } from "./filters";
import { daysBetween, parseDateParts } from "./format";
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
  /** 応援開始からの経過。未設定・未来の日付なら null */
  fanDuration: FanDuration | null;
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

/** 応援開始からの経過期間 */
export type FanDuration = {
  /** 満何年 */
  years: number;
  /** 直近の記念日からの日数 */
  days: number;
  /** 通算日数（開始日当日を 1 日目とする） */
  totalDays: number;
};

/**
 * 応援開始日からの経過を「〇年〇日」に分解する。
 * 未来の日付が入っていたら null（まだ始まっていない）。
 */
export function fanDurationFrom(fanSince: string, today: string): FanDuration | null {
  const elapsed = daysBetween(fanSince, today);
  if (elapsed < 0) return null;

  const since = parseDateParts(fanSince);
  const now = parseDateParts(today);

  // 今年の記念日がまだ来ていなければ、満年数を 1 つ減らす
  let years = now.y - since.y;
  if (now.m < since.m || (now.m === since.m && now.d < since.d)) years -= 1;

  const pad = (n: number) => String(n).padStart(2, "0");
  const anniversary = `${since.y + years}-${pad(since.m)}-${pad(since.d)}`;

  return {
    years,
    // 2/29 開始の年で記念日が存在しない場合に備えて下限を 0 にする
    days: Math.max(daysBetween(anniversary, today), 0),
    totalDays: elapsed + 1,
  };
}

/** 「11年144日」の形にする（1 年未満は日数だけ、記念日ちょうどなら年だけ） */
export function formatFanDuration({ years, days }: FanDuration): string {
  if (years === 0) return `${days}日`;
  return days === 0 ? `${years}年` : `${years}年${days}日`;
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
        fanDuration: setting?.fan_since ? fanDurationFrom(setting.fan_since, today) : null,
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
