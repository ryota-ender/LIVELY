/**
 * @svg-maps/japan (MIT) の県境パスデータから、
 * 都道府県コード付きの静的データ src/lib/japan-geo.ts を生成する。
 *
 *   node scripts/generate-japan-geo.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const japan = require("@svg-maps/japan").default ?? require("@svg-maps/japan");

const __dirname = dirname(fileURLToPath(import.meta.url));

/** JIS 都道府県コード順（コード, svg-maps の id） */
const ORDER = [
  ["01", "hokkaido"],
  ["02", "aomori"],
  ["03", "iwate"],
  ["04", "miyagi"],
  ["05", "akita"],
  ["06", "yamagata"],
  ["07", "fukushima"],
  ["08", "ibaraki"],
  ["09", "tochigi"],
  ["10", "gunma"],
  ["11", "saitama"],
  ["12", "chiba"],
  ["13", "tokyo"],
  ["14", "kanagawa"],
  ["15", "niigata"],
  ["16", "toyama"],
  ["17", "ishikawa"],
  ["18", "fukui"],
  ["19", "yamanashi"],
  ["20", "nagano"],
  ["21", "gifu"],
  ["22", "shizuoka"],
  ["23", "aichi"],
  ["24", "mie"],
  ["25", "shiga"],
  ["26", "kyoto"],
  ["27", "osaka"],
  ["28", "hyogo"],
  ["29", "nara"],
  ["30", "wakayama"],
  ["31", "tottori"],
  ["32", "shimane"],
  ["33", "okayama"],
  ["34", "hiroshima"],
  ["35", "yamaguchi"],
  ["36", "tokushima"],
  ["37", "kagawa"],
  ["38", "ehime"],
  ["39", "kochi"],
  ["40", "fukuoka"],
  ["41", "saga"],
  ["42", "nagasaki"],
  ["43", "kumamoto"],
  ["44", "oita"],
  ["45", "miyazaki"],
  ["46", "kagoshima"],
  ["47", "okinawa"],
];

const byId = new Map(japan.locations.map((l) => [l.id, l]));

const missing = ORDER.filter(([, id]) => !byId.has(id));
if (missing.length > 0) {
  throw new Error(`パスが見つからない都道府県: ${missing.map(([, id]) => id).join(", ")}`);
}

const entries = ORDER.map(([code, id]) => {
  const { path } = byId.get(id);
  return `  { code: "${code}", slug: "${id}", path: ${JSON.stringify(path)} },`;
}).join("\n");

const out = `// このファイルは scripts/generate-japan-geo.mjs で自動生成されています。手で編集しないでください。
// 県境パスデータ: @svg-maps/japan (MIT License)

export type PrefecturePath = {
  /** JIS 都道府県コード（01〜47） */
  code: string;
  /** ローマ字スラッグ */
  slug: string;
  /** SVG path の d 属性 */
  path: string;
};

/** 日本地図 SVG の viewBox */
export const JAPAN_VIEW_BOX = ${JSON.stringify(japan.viewBox)};

export const JAPAN_PATHS: PrefecturePath[] = [
${entries}
];
`;

const dest = resolve(__dirname, "../src/lib/japan-geo.ts");
writeFileSync(dest, out, "utf8");
console.log(`generated ${dest} (${JAPAN_PATHS_COUNT()} prefectures)`);

function JAPAN_PATHS_COUNT() {
  return ORDER.length;
}
