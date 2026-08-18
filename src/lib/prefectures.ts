/**
 * 都道府県のメタデータ（コード・名前・地域）。
 * 地図の県境パスは重いので、ここには含めず lib/japan-map.ts で合流させている。
 */

export const REGIONS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州・沖縄",
] as const;

export type Region = (typeof REGIONS)[number];

export type Prefecture = {
  /** JIS 都道府県コード（"01"〜"47"） */
  code: string;
  /** 都道府県名（例: 東京都） */
  name: string;
  /** 「都・府・県」を除いた短い名前（例: 東京） */
  shortName: string;
  region: Region;
};

const META: Array<[code: string, name: string, shortName: string, region: Region]> = [
  ["01", "北海道", "北海道", "北海道"],
  ["02", "青森県", "青森", "東北"],
  ["03", "岩手県", "岩手", "東北"],
  ["04", "宮城県", "宮城", "東北"],
  ["05", "秋田県", "秋田", "東北"],
  ["06", "山形県", "山形", "東北"],
  ["07", "福島県", "福島", "東北"],
  ["08", "茨城県", "茨城", "関東"],
  ["09", "栃木県", "栃木", "関東"],
  ["10", "群馬県", "群馬", "関東"],
  ["11", "埼玉県", "埼玉", "関東"],
  ["12", "千葉県", "千葉", "関東"],
  ["13", "東京都", "東京", "関東"],
  ["14", "神奈川県", "神奈川", "関東"],
  ["15", "新潟県", "新潟", "中部"],
  ["16", "富山県", "富山", "中部"],
  ["17", "石川県", "石川", "中部"],
  ["18", "福井県", "福井", "中部"],
  ["19", "山梨県", "山梨", "中部"],
  ["20", "長野県", "長野", "中部"],
  ["21", "岐阜県", "岐阜", "中部"],
  ["22", "静岡県", "静岡", "中部"],
  ["23", "愛知県", "愛知", "中部"],
  ["24", "三重県", "三重", "近畿"],
  ["25", "滋賀県", "滋賀", "近畿"],
  ["26", "京都府", "京都", "近畿"],
  ["27", "大阪府", "大阪", "近畿"],
  ["28", "兵庫県", "兵庫", "近畿"],
  ["29", "奈良県", "奈良", "近畿"],
  ["30", "和歌山県", "和歌山", "近畿"],
  ["31", "鳥取県", "鳥取", "中国"],
  ["32", "島根県", "島根", "中国"],
  ["33", "岡山県", "岡山", "中国"],
  ["34", "広島県", "広島", "中国"],
  ["35", "山口県", "山口", "中国"],
  ["36", "徳島県", "徳島", "四国"],
  ["37", "香川県", "香川", "四国"],
  ["38", "愛媛県", "愛媛", "四国"],
  ["39", "高知県", "高知", "四国"],
  ["40", "福岡県", "福岡", "九州・沖縄"],
  ["41", "佐賀県", "佐賀", "九州・沖縄"],
  ["42", "長崎県", "長崎", "九州・沖縄"],
  ["43", "熊本県", "熊本", "九州・沖縄"],
  ["44", "大分県", "大分", "九州・沖縄"],
  ["45", "宮崎県", "宮崎", "九州・沖縄"],
  ["46", "鹿児島県", "鹿児島", "九州・沖縄"],
  ["47", "沖縄県", "沖縄", "九州・沖縄"],
];

export const PREFECTURES: Prefecture[] = META.map(([code, name, shortName, region]) => ({
  code,
  name,
  shortName,
  region,
}));

export const PREFECTURE_COUNT = PREFECTURES.length;

const byCode = new Map(PREFECTURES.map((p) => [p.code, p]));

export function getPrefecture(code: string | null | undefined): Prefecture | undefined {
  if (!code) return undefined;
  return byCode.get(code);
}

export function prefectureName(code: string | null | undefined): string {
  return getPrefecture(code)?.name ?? "";
}

export function isPrefectureCode(value: unknown): value is string {
  return typeof value === "string" && byCode.has(value);
}

/** 地域ごとにまとめた都道府県一覧（表示順は REGIONS に従う） */
export function prefecturesByRegion(): Array<{ region: Region; prefectures: Prefecture[] }> {
  return REGIONS.map((region) => ({
    region,
    prefectures: PREFECTURES.filter((p) => p.region === region),
  }));
}
