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

export { JAPAN_VIEW_BOX };
