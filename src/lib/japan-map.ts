import { JAPAN_PATHS, JAPAN_VIEW_BOX } from "./japan-geo";
import { PREFECTURES, type Prefecture } from "./prefectures";

export type PrefectureShape = Prefecture & {
  /** SVG path の d 属性 */
  path: string;
};

const pathByCode = new Map(JAPAN_PATHS.map((p) => [p.code, p.path]));

/** 地図描画用：都道府県メタデータに県境パスを合流させたもの */
export const PREFECTURE_SHAPES: PrefectureShape[] = PREFECTURES.map((pref) => ({
  ...pref,
  path: pathByCode.get(pref.code) ?? "",
}));

/**
 * 元データの viewBox は "0 0 438 516" で、北海道や沖縄の輪郭が縁ぎりぎりに接している。
 * 選択時の輪郭線が切れないよう、四辺に少し余白を足したものを描画に使う。
 */
export const JAPAN_VIEW_BOX_PADDED = "-4 -4 446 524";

/** 沖縄は実際の位置ではなく左下に寄せて描かれているため、囲み枠を添える */
export const OKINAWA_INSET = { x: -3, y: 414, width: 133, height: 106 };

export { JAPAN_VIEW_BOX };
