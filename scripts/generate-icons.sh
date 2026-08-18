#!/usr/bin/env bash
# ルートの icon.png（マスター画像）から、各種アプリアイコンを生成する。
# macOS の sips を使用します。
#
#   bash scripts/generate-icons.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SRC="icon.png"
if [ ! -f "$SRC" ]; then
  echo "マスター画像 $SRC が見つかりません" >&2
  exit 1
fi

mkdir -p public/icons

gen() { # gen <size> <dest>
  cp "$SRC" "$2"
  sips -s format png -Z "$1" "$2" >/dev/null
}

# ブラウザのタブ / 一般的な favicon（Next.js の app/icon.png 規約）
gen 512 src/app/icon.png

# iOS のホーム画面（Next.js の app/apple-icon.png 規約）
gen 180 src/app/apple-icon.png

# Web App Manifest 用
gen 192 public/icons/icon-192.png
gen 512 public/icons/icon-512.png

# Android のマスカブルアイコン用。
# 円形などにマスクされても欠けないよう、80% に縮小して黒背景で余白を足す。
gen 410 public/icons/icon-maskable-512.png
sips -p 512 512 --padColor 000000 public/icons/icon-maskable-512.png >/dev/null

echo "生成しました:"
ls -la src/app/icon.png src/app/apple-icon.png public/icons
