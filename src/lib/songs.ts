/**
 * 曲まわりの共通処理（サーバー / 画面の両方から使う）。
 *
 * セトリは lives.setlist に自由入力のテキストで持っている。
 * それを 1 行 1 曲に分解し、曲名を正規化したキーで
 * アーティストの全曲カタログ（songs テーブル）と突き合わせる。
 */

/** songs テーブルの 1 行（iTunes から取り込んだ全曲カタログ） */
export type Song = {
  id: string;
  user_id: string;
  /** lives / artists と同じく名前で結び付ける */
  artist_name: string;
  title: string;
  /** 照合用に正規化した曲名 */
  title_key: string;
  album: string | null;
  release_date: string | null;
  artwork_url: string | null;
  track_url: string | null;
};

/**
 * 表記ゆれを吸収した照合用のキーを作る。
 *
 * - 全角・半角や大文字・小文字の違いをなくす
 * - (Live) (feat. 〇〇) (2023 Remaster) - Single などの付記を落とす
 * - 空白と記号を落とす（「Dragon Night」と「DragonNight」を同じ曲とみなす）
 */
export function titleKey(title: string): string {
  return (
    title
      .normalize("NFKC")
      .toLowerCase()
      // 括弧で囲まれた付記のうち、版違い・参加アーティストを表すもの
      .replace(
        /\s*[(\[【〈<]\s*(?:live|ライブ|remaster|remastered|ver\.?|version|バージョン|mix|remix|edit|feat\.?|ft\.?|with|acoustic|アコースティック|instrumental|inst\.?|short|tv size|original|piano|orchestra|self cover|セルフカバー|20\d\d)[^)\]】〉>]*[)\]】〉>]/gi,
        "",
      )
      // 末尾の「 - Single」「 - Live at 〇〇」など
      .replace(/\s+-\s+(?:single|ep|remaster.*|live.*|from .*)$/i, "")
      // 空白と記号
      .replace(/[\s・･\-‐‑–—―~〜～!！?？'"“”‘’`.,，、。:：;；/／&＆*＊#＃☆★♪]/g, "")
  );
}

/** 見出しとして扱う語（MC・アンコールなど） */
const HEADER_WORD =
  /^(?:mc|se|アンコール|ダブルアンコール|wアンコール|encore|en|opening|ending|intro|outro|本編|休憩)$/i;

/** 「--- アンコール ---」「【EN】」のように装飾で囲まれた見出し */
const DECORATED_HEADER = /^[\s\-=＊*~〜_＿#【\[(（<〈]+(.+?)[\s\-=＊*~〜_＿#】\])）>〉]+$/;

/** 区切り線だけの行 */
const RULE_LINE = /^[\s\-=＊*~〜_＿#]+$/;

function isHeaderLine(line: string): boolean {
  const compact = line.replace(/\s/g, "");
  if (compact === "" || RULE_LINE.test(line) || HEADER_WORD.test(compact)) return true;
  const decorated = line.match(DECORATED_HEADER);
  return decorated ? HEADER_WORD.test(decorated[1].replace(/\s/g, "")) : false;
}

/**
 * 行頭の番号を外す。
 * 数字のあとに区切り（. ) 、 や空白）がある場合だけ外すので、
 * 「2021」「1/2」のような数字で始まる曲名は壊さない。
 * M / EN の接頭辞も数字が続くときだけ外す（「Mela!」「MC」は残る）。
 */
const ENUMERATOR = /^(?:(?:m|en|e)\s*-?\s*(?=\d))?\d{1,3}(?:\s*[.):．、]\s*|\s+)/i;

/** 行頭の箇条書き記号 */
const BULLET = /^[・•*]\s*|^-\s+/;

/**
 * 自由入力のセトリを曲名の配列にする。
 *
 * 次のような書き方をどれも受け付ける。
 *   1. 曲名 / 01 曲名 / M1 曲名 / M-1. 曲名 / EN1. 曲名 / ・曲名 / 曲名
 * 「MC」「アンコール」「--- アンコール ---」のような見出し行は除く。
 */
export function parseSetlist(text: string | null | undefined): string[] {
  if (!text) return [];

  return text
    .split(/\r?\n/)
    .map((raw) => raw.normalize("NFKC").trim())
    .filter((line) => !isHeaderLine(line))
    .map((line) => line.replace(BULLET, "").replace(ENUMERATOR, "").trim())
    .filter((line) => !isHeaderLine(line));
}
