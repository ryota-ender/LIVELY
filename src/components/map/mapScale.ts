/**
 * 地図の塗り分け。参戦済みか未参戦かの 2 色だけで表す。
 * 参戦回数はホバー時のツールチップと、下の一覧の数字で確認できる。
 */

export const UNVISITED_FILL = "#241b42";
export const VISITED_FILL = "#ff3ec8";

export function fillFor(count: number): string {
  return count > 0 ? VISITED_FILL : UNVISITED_FILL;
}

export const LEGEND = [
  { label: "未参戦", fill: UNVISITED_FILL },
  { label: "参戦済み", fill: VISITED_FILL },
] as const;
