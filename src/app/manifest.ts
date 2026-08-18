import type { MetadataRoute } from "next";

/**
 * ホーム画面に追加したときのアプリ情報（PWA マニフェスト）。
 * アイコンはルートの icon.png から scripts/generate-icons.sh で生成している。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIVELY - ライブ記録",
    short_name: "LIVELY",
    description:
      "参戦したライブを記録して、都道府県ごとの制覇マップや統計で振り返れるライブ記録アプリ。",
    lang: "ja",
    dir: "ltr",
    start_url: "/lives",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06030e",
    theme_color: "#06030e",
    categories: ["music", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "ライブ一覧", url: "/lives" },
      { name: "制覇マップ", url: "/map" },
      { name: "統計", url: "/stats" },
    ],
  };
}
