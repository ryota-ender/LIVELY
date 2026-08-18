/** 参戦回数を 0〜4 の濃さに変換する（絶対値ベースなので凡例が分かりやすい） */
export function countLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  return 4;
}

/** 濃さごとの塗り色（未参戦 → 最多） */
export const LEVEL_FILLS = [
  "#241b42", // 0: 未参戦
  "#5b2a7a",
  "#8c2f9e",
  "#c635b6",
  "#ff3ec8", // 4: 8回以上
] as const;

export const LEVEL_LABELS = ["未参戦", "1回", "2〜3回", "4〜7回", "8回〜"] as const;
