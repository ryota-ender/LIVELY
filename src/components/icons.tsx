import type { SVGProps } from "react";

/**
 * アプリ共通のアイコン。絵文字を使わず、線の太さ・角の丸み・サイズを
 * すべて揃えた自前の SVG に統一している。
 *
 * - 24 × 24 のマス目
 * - 塗りなし・線は currentColor（親の文字色に追従する）
 * - 線幅 1.75 / 端と角は丸
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** チケット（ライブ）。アプリアイコンのモチーフに合わせて切り取り線を入れている */
export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M15 6.5v2M15 11v2M15 15.5v2" />
    </Icon>
  );
}

/** 地図のピン（制覇マップ） */
export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21c4-4.2 6-7.5 6-10a6 6 0 1 0-12 0c0 2.5 2 5.8 6 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </Icon>
  );
}

/** 棒グラフ（統計） */
export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-5.5M12 20.5v-11M17 20.5v-7.5" />
    </Icon>
  );
}

/** マイク（次のライブ） */
export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="2.5" width="6" height="10.5" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5v4M9 21.5h6" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 5.5L16 12l-6.5 6.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

/** 絞り込み */
export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6.5h17M6.5 12h11M10 17.5h4" />
    </Icon>
  );
}

/** 外部リンク（地図で開く） */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5L11 13" />
      <path d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5" />
    </Icon>
  );
}

/** 削除 */
export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15M9.5 6.5V4.75A1.25 1.25 0 0 1 10.75 3.5h2.5a1.25 1.25 0 0 1 1.25 1.25V6.5" />
      <path d="M6.5 6.5l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
    </Icon>
  );
}

/** 画像 */
export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.75" cy="9.75" r="1.5" />
      <path d="M4 16.5l4.5-4a2 2 0 0 1 2.7.1l5.3 5.4M14.5 14l1.6-1.5a2 2 0 0 1 2.7 0l1.7 1.6" />
    </Icon>
  );
}

/** 保存（ダウンロード） */
export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11M7.5 10L12 14.5 16.5 10" />
      <path d="M4.5 17v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V17" />
    </Icon>
  );
}

/** 共有 */
export function ShareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11" />
      <path d="M8 7.5L12 3.5l4 4" />
      <path d="M4.5 14v4.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14" />
    </Icon>
  );
}

/** アーティスト（応援） */
export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5C7 17 3.5 14 3.5 10.25A4.25 4.25 0 0 1 12 8.4a4.25 4.25 0 0 1 8.5 1.85C20.5 14 17 17 12 20.5Z" />
    </Icon>
  );
}
