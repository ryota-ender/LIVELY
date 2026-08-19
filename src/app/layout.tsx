import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";

import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LIVELY",
    template: "%s | LIVELY",
  },
  description:
    "参戦したライブを記録して、都道府県ごとの制覇マップや統計で振り返れるライブ記録アプリ。",
  applicationName: "LIVELY",
  appleWebApp: {
    capable: true,
    title: "LIVELY",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06030e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // ホーム画面から起動したときに画面いっぱいに表示する
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">{children}</body>
    </html>
  );
}
