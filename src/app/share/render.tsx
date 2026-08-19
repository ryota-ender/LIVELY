import { ImageResponse } from "next/og";

import { SHARE_IMAGE_WIDTH, type ShareRow } from "@/lib/share-image";

/**
 * 件数が増えたら画像を縦に伸ばして全部載せる。
 * 極端に長くなったときだけ「他 N 件」に丸める安全弁として上限を置く。
 */
export const MAX_ROWS = 60;

/** ゆったり表示（アーティストと会場で 2 行）で収まる件数。超えたら 1 行表示に切り替える */
const ROOMY_LIMIT = 10;

/** 高さの計算に使う実測値 */
const PADDING = 72;
const HEADER_HEIGHT = 116;
const ROOMY_ROW = 96;
const DENSE_ROW = 50;
const MIN_HEIGHT = 1080;

/** 件数から画像の高さを決める */
export function shareImageHeight(rowCount: number, overflow: number): number {
  const rowHeight = rowCount > ROOMY_LIMIT ? DENSE_ROW : ROOMY_ROW;
  const overflowLine = overflow > 0 ? 52 : 0;
  const content = PADDING * 2 + HEADER_HEIGHT + rowCount * rowHeight + overflowLine + 32;
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
  badge: string;
  rows: ShareRow[];
  total: number;
  overflow: number;
};

/** 参戦履歴 / 参戦予定を 1 枚の PNG にする */
export async function renderShareImage(input: ShareImageInput): Promise<ImageResponse> {
  const { title, badge, rows, total, overflow } = input;

  const dense = rows.length > ROOMY_LIMIT;
  const overflowText = overflow > 0 ? `他 ${overflow} 件` : "";

  // 画像に出る文字をすべて集めてサブセットを作る
  const usedText = [
    title,
    badge,
    overflowText,
    "本0123456789/・記録がありません",
    ...rows.flatMap((r) => [r.date, r.artist, r.place]),
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1 }}>
            {title}
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 24,
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
          <div style={{ display: "flex", alignItems: "flex-end", marginLeft: "auto" }}>
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
                  width: dense ? 96 : 104,
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
                    {row.artist}
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
                    {row.place}
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
                    {row.artist}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginTop: 3,
                      fontSize: 22,
                      color: "#a99fc4",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.place}
                  </div>
                </div>
              )}
            </div>
          ))}

          {overflowText ? (
            <div style={{ display: "flex", fontSize: 24, color: "#7b7196", marginTop: 14 }}>
              {overflowText}
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
      height: shareImageHeight(rows.length, overflow),
      fonts: [
        { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
      ],
      // 本人しか見られない内容なので private。同じ条件での再取得だけ抑える
      headers: { "Cache-Control": "private, max-age=60" },
    },
  );
}
