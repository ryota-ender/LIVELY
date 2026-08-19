/**
 * 参戦回数を 0〜4 の濃さに変換する。
 * 「1〜10 回」のように区切りが絶対値なので、凡例をそのまま読める。
 */
export function countLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 10) return 1;
  if (count <= 20) return 2;
  if (count <= 30) return 3;
  return 4;
}

/** 濃さごとの塗り色（未参戦 → 最多）。深い紫からネオンピンクへ等間隔に補間している */
export const LEVEL_FILLS = [
  "#241b42", // 0: 未参戦
  "#4a2568", // 1: 1〜10 回
  "#862d88", // 2: 11〜20 回
  "#c336a8", // 3: 21〜30 回
  "#ff3ec8", // 4: 31 回〜
] as const;

export const LEVEL_LABELS = ["未参戦", "1〜10回", "11〜20回", "21〜30回", "31回〜"] as const;
