import { ImageResponse } from "next/og";

import { SHARE_IMAGE_WIDTH, type ShareRow } from "@/lib/share-image";

/** ゆったり表示（アーティストと会場で 2 行）で収まる件数。超えたら 1 行表示に切り替える */
const ROOMY_LIMIT = 10;

/** 高さの計算に使う実測値 */
const PADDING = 72;
const HEADER_HEIGHT = 116;
const ROOMY_ROW = 96;
const DENSE_ROW = 50;
const MIN_HEIGHT = 1080;

/** 見出しの左側（件数表示を除いた幅） */
const TITLE_WIDTH = 640;

/** 見出しが長いときは文字を小さくする */
function titleFontSize(title: string): number {
  const len = [...title].length;
  if (len <= 9) return 64;
  if (len <= 16) return 52;
  return 44;
}

/** 見出しが何行に折り返すかの概算（全角を 1、半角を 0.55 文字分として数える） */
function titleLines(title: string): number {
  const size = titleFontSize(title);
  const width = [...title].reduce((sum, ch) => sum + (ch.charCodeAt(0) < 0x2e80 ? 0.55 : 1), 0) * size;
  return Math.max(1, Math.ceil(width / TITLE_WIDTH));
}

/** 見出しの高さ。名前が長い・補足があるときは縦に積むので高くなる */
function headerHeight(title: string, stacked: boolean): number {
  if (!stacked) return HEADER_HEIGHT;
  return titleLines(title) * titleFontSize(title) * 1.2 + 70 + 22;
}

/** 件数から画像の高さを決める */
export function shareImageHeight(
  rowCount: number,
  hasPageLabel: boolean,
  header: number = HEADER_HEIGHT,
): number {
  const rowHeight = rowCount > ROOMY_LIMIT ? DENSE_ROW : ROOMY_ROW;
  const pageLabelHeight = hasPageLabel ? 50 : 0;
  const content = PADDING * 2 + header + rowCount * rowHeight + pageLabelHeight + 32;
  return Math.max(content, MIN_HEIGHT);
}

/**
 * Google Fonts から、実際に使う文字だけに絞ったフォントを取ってくる。
 * 日本語フォントは全体だと数 MB あり ImageResponse の上限を超えるため、
 * text= でサブセットを作らせている（数十 KB に収まる）。
 *
 * 古い User-Agent を送るのは、woff2 ではなく Satori が読める ttf を返させるため。
 */
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27";

async function loadFont(text: string, weight: 400 | 700): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, { headers: { "User-Agent": LEGACY_UA } }).then((r) => r.text());

  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error("フォントの取得に失敗しました");

  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export type ShareImageInput = {
  title: string;
  /** 見出しの補足（ツアーならアーティスト名など） */
  subtitle: string | null;
  badge: string;
  rows: ShareRow[];
  /** 期間全体の件数（分割していても合計を出す） */
  total: number;
  page: number;
  pageCount: number;
};

/** 参戦履歴 / 参戦予定を 1 枚の PNG にする */
export async function renderShareImage(input: ShareImageInput): Promise<ImageResponse> {
  const { title, subtitle, badge, rows, total, page, pageCount } = input;

  const dense = rows.length > ROOMY_LIMIT;
  // 「2026年 参戦予定」のような短い見出しは 1 行、アーティスト名・ツアー名は縦に積む
  const stacked = subtitle !== null || titleFontSize(title) < 64;
  const header = headerHeight(title, stacked);
  // 年付きの日付（2019/5/1）は幅を広く取る
  const withYear = rows.some((r) => r.date.split("/").length === 3);
  const dateWidth = withYear ? (dense ? 150 : 170) : dense ? 96 : 104;

  const badgeEl = (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        fontSize: 28,
        fontWeight: 700,
        color: "#0d0819",
        backgroundColor: "#ff3ec8",
        borderRadius: 999,
        padding: "8px 24px",
      }}
    >
      {badge}
    </div>
  );
  const pageLabel = pageCount > 1 ? `${page} / ${pageCount}` : "";

  // 画像に出る文字をすべて集めてサブセットを作る
  const usedText = [
    title,
    subtitle ?? "",
    badge,
    pageLabel,
    // 「…」は長い名前を省略するときに Satori が使う
    "本0123456789/・…記録がありません",
    ...rows.flatMap((r) => [r.date, r.main, r.sub]),
  ].join("");

  const [regular, bold] = await Promise.all([loadFont(usedText, 400), loadFont(usedText, 700)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 72,
          color: "#ece8f7",
          backgroundColor: "#06030e",
          backgroundImage:
            "radial-gradient(1200px 700px at 0% 0%, rgba(255,62,200,0.22), transparent 60%), radial-gradient(1100px 700px at 100% 8%, rgba(59,167,255,0.20), transparent 60%), radial-gradient(1200px 800px at 50% 110%, rgba(168,85,247,0.18), transparent 65%)",
          fontFamily: "Noto Sans JP",
        }}
      >
        {/* 見出し：2026年 参戦予定 ○本 */}
        <div style={{ display: "flex", alignItems: stacked ? "flex-end" : "center" }}>
          {stacked ? (
            <div style={{ display: "flex", flexDirection: "column", width: TITLE_WIDTH }}>
              <div
                style={{
                  display: "flex",
                  fontSize: titleFontSize(title),
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </div>
              <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
                {badgeEl}
                {subtitle ? (
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 20,
                      fontSize: 30,
                      fontWeight: 700,
                      color: "#a99fc4",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {subtitle}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1 }}>
                {title}
              </div>
              <div style={{ display: "flex", marginLeft: 24 }}>{badgeEl}</div>
            </>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", marginLeft: "auto", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                fontWeight: 700,
                lineHeight: 0.85,
                color: "#ff3ec8",
              }}
            >
              {total}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                marginLeft: 10,
                marginBottom: 4,
                color: "#a99fc4",
              }}
            >
              本
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: 4, backgroundColor: "#2e2350", marginTop: 22 }} />

        {/* 一覧 */}
        <div style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 12,
            flexGrow: 1,
          }}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                paddingTop: dense ? 7 : 11,
                paddingBottom: dense ? 7 : 11,
                borderBottom: "1px solid #241b42",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: dateWidth,
                  flexShrink: 0,
                  fontSize: dense ? 23 : 26,
                  fontWeight: 700,
                  color: "#7b7196",
                }}
              >
                {row.date}
              </div>

              {dense ? (
                // 件数が多いときはアーティストと会場を 1 行にまとめる
                <div style={{ display: "flex", alignItems: "baseline", flexGrow: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      maxWidth: 520,
                      fontSize: 25,
                      fontWeight: 700,
                      color: "#34e0e8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.main}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 14,
                      fontSize: 20,
                      color: "#7b7196",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.sub}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 29,
                      fontWeight: 700,
                      color: "#34e0e8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.main}
                  </div>
                  <div
                    style={{
                      display: row.sub ? "flex" : "none",
                      marginTop: 3,
                      fontSize: 22,
                      color: "#a99fc4",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.sub}
                  </div>
                </div>
              )}
            </div>
          ))}

          {pageLabel ? (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
                fontSize: 24,
                fontWeight: 700,
                color: "#7b7196",
              }}
            >
              {pageLabel}
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color: "#7b7196",
              }}
            >
              記録がありません
            </div>
          ) : null}
        </div>

      </div>
    ),
    {
      width: SHARE_IMAGE_WIDTH,
      height: shareImageHeight(rows.length, pageLabel !== "", header),
      fonts: [
        { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
      ],
      // 本人しか見られない内容なので private。同じ条件での再取得だけ抑える
      headers: { "Cache-Control": "private, max-age=60" },
    },
  );
}
