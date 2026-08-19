# LIVELY

参戦したライブを記録して、**都道府県ごとの制覇マップ**や統計で振り返れるライブ記録アプリです。
スマホのホーム画面に追加すればアプリのように使えます（PWA 対応）。

Java / JSP / Tomcat / MySQL で作っていた **LivePlan** を、Next.js + Supabase + Vercel の構成に作り直したものです。

---

## 1. 主な機能

| 機能 | 説明 |
| --- | --- |
| アカウント作成 / ログイン | Supabase Auth（メールアドレス + パスワード）。自分のデータだけを読み書きできる |
| ライブ一覧 | 既定は「これから参戦するライブ」を開催日が近い順に表示。カード形式で、開催前 / 本日 / 参戦済みをバッジで色分け |
| カレンダー表示 | 月表示に切り替えて、日付ごとのライブを確認できる（表示設定は端末に記憶） |
| 絞り込み | アーティスト・開催状況（これから / 参戦済み / すべて）・種別・都道府県・年・月 |
| 並び替え | 新しい順 / 古い順 / アーティスト順 |
| 新規登録・編集・削除 | すべてモーダルで完結。同じアーティスト × 同じ日付は重複警告を出す |
| 画像添付 | チケットやフライヤーを Supabase Storage（非公開）に保存 |
| **都道府県 制覇マップ** | 参戦した都道府県が濃く光る日本地図。県をタップするとその県のライブ一覧が出る |
| 統計 | 年別・月別・アーティスト別・会場別・都道府県別・種別のグラフ |
| 次のライブまで | 直近のライブまでの残り日数を一覧の先頭に表示 |
| 開場カウントダウン | 当日は開場までの残り時間、開場後は開演までを 1 秒ごとに表示 |
| 画像で書き出す | 参戦履歴 / 参戦予定を月別・年別に 1 枚の画像（1080×1350）にして保存・共有 |

登録項目は、アーティスト・ライブタイトル・開催日・種別・開場 / 開演時間・都道府県・会場・画像・メモ・セットリストです。
アーティスト欄は既定で 1 行、「＋ アーティストを追加」で行が増え、対バンやフェスの出演者をまとめて登録できます
（1 行目がメイン、2 行目以降が共演として保存されます）。

---

## 2. 技術スタック

| 区分 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 16（App Router / Server Components / Server Actions） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| 認証・DB・ストレージ | Supabase（Auth / Postgres + RLS / Storage） |
| ホスティング | Vercel |
| 地図データ | [@svg-maps/japan](https://www.npmjs.com/package/@svg-maps/japan)（MIT）の県境パス |

---

## 3. ディレクトリ構成

```
src/
├ app/
│  ├ layout.tsx            ルートレイアウト（フォント・メタデータ・テーマ）
│  ├ manifest.ts           PWA マニフェスト（ホーム画面用）
│  ├ icon.png              ブラウザのタブ用アイコン
│  ├ apple-icon.png        iOS ホーム画面用アイコン
│  ├ page.tsx              ログイン状態に応じて /lives か /login へ振り分け
│  ├ auth-actions.ts       ログイン・アカウント作成・ログアウト（Server Actions）
│  ├ login/ , signup/      認証画面
│  └ (app)/                ログインが必要な画面
│     ├ layout.tsx         認証ガード + ヘッダー + 下部タブ
│     ├ lives/             ライブ一覧・登録・編集・削除
│     ├ map/               都道府県 制覇マップ
│     └ stats/             統計
├ components/              画面部品（lives / map / charts / auth）
├ lib/
│  ├ supabase/             Supabase クライアント（ブラウザ用 / サーバー用）
│  ├ lives.ts              ライブの取得と画像の署名付き URL 付与
│  ├ filters.ts            絞り込み・並び替え
│  ├ stats.ts              集計
│  ├ prefectures.ts        都道府県のメタデータ（コード・名前・地域）
│  ├ japan-geo.ts          県境パスデータ（自動生成）
│  └ japan-map.ts          メタデータ + パスの合流
├ proxy.ts                 セッション更新とアクセス制御（Next.js 16 の proxy）
supabase/schema.sql        テーブル・RLS・ストレージの定義
scripts/                   アイコン生成・地図データ生成スクリプト
```

### 処理の流れ

```
ブラウザ
   │
   ▼
proxy.ts                    ← セッション Cookie の更新・未ログインの振り分け
   ▼
Server Component (page.tsx) ← Supabase から取得し、絞り込み・集計して描画
   ▼
Client Component            ← モーダル・カレンダー・地図などの操作
   │  Server Action
   ▼
Supabase（Postgres + RLS / Storage）
```

**セキュリティの考え方**: 「自分のデータだけ操作できる」ことをアプリ側の条件分岐ではなく、
データベースの行レベルセキュリティ（RLS）で保証しています。仮に API を直接叩かれても、
他人の行は読めず・書けません。画像も非公開バケットに置き、表示のたびに 1 時間有効の署名付き URL を発行しています。

---

## 4. データベース設計

### lives テーブル

| 列 | 型 | 説明 |
| --- | --- | --- |
| id | uuid（主キー） | ライブ ID |
| user_id | uuid（→ auth.users.id） | 登録したユーザー |
| artist_name | text | アーティスト名（メイン） |
| co_artists | text[] | 共演アーティスト |
| live_title | text | ライブタイトル |
| live_date | date | 開催日 |
| open_time / start_time | time | 開場 / 開演時間 |
| venue | text | 会場 |
| prefecture_code | text | JIS 都道府県コード（'01'〜'47'）※制覇マップの集計に使用 |
| live_type | text | oneman / taiban / fes |
| memo | text | メモ |
| setlist | text | セットリスト |
| image_path | text | Storage 内の画像パス |
| created_at / updated_at | timestamptz | 作成 / 更新日時 |

RLS ポリシーにより、`auth.uid() = user_id` の行だけ select / insert / update / delete できます。

---

## 5. セットアップ

### 5-1. Supabase プロジェクトを作る

1. [supabase.com](https://supabase.com) でプロジェクトを作成する
2. ダッシュボードの **SQL Editor** で [`supabase/schema.sql`](supabase/schema.sql) をそのまま実行する
   （テーブル・インデックス・RLS ポリシー・画像用ストレージがまとめて作られます）
3. **Project Settings → API** から `Project URL` と `anon public` キーを控える

> **「潜在的な問題が検出されました」という警告が出たら**
> そのまま「クエリを実行する」で問題ありません。SQL Editor は `drop` や `create or replace` と
> いう単語を見つけると中身に関係なく警告を出します。`schema.sql` に含まれる `drop` は
> ポリシーとトリガーの `drop ... if exists` だけで、いずれも直後に同じものを作り直しています
> （何度実行しても同じ結果になるようにするためです）。`drop table` / `truncate` / `delete` は
> 1 つも含まれておらず、テーブルは `create table if not exists` なので既存データは消えません。

> メール確認を省いてすぐ使いたい場合は、**Authentication → Sign In / Providers → Email** の
> 「Confirm email」をオフにしてください。オンのままだと、アカウント作成後に届くメールのリンクを
> 開いてからログインする流れになります。

> 実行後は次の SQL で結果を確認できます（**10 行**返れば完了です）。
>
> ```sql
> select 'テーブル' as 種別, table_name as 名前, '' as 詳細
>   from information_schema.tables where table_schema='public' and table_name='lives'
> union all
> select 'livesのRLS', policyname, cmd from pg_policies where tablename='lives'
> union all
> select 'バケット', id, public::text from storage.buckets where id='live-images'
> union all
> select 'ストレージのRLS', policyname, cmd
>   from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'live_images%';
> ```

### 5-2. ローカルで動かす

```bash
npm install
cp .env.example .env.local   # 取得した URL とキーを記入する
npm run dev                  # http://localhost:3000
```

### 5-3. Vercel にデプロイする

1. Vercel で GitHub リポジトリをインポートする（フレームワークは Next.js が自動検出されます）
2. **Environment Variables** に以下の 2 つを登録する
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. デプロイ後、Supabase の **Authentication → URL Configuration** の
   `Site URL` に Vercel の URL を設定する（確認メールのリンク先になります）

### 5-4. 旧 LivePlan のデータを取り込む（任意）

旧アプリ（MySQL）に登録していたライブ記録は、`supabase/import-liveplan-data.sql` を
SQL Editor で実行して取り込みます。

**このファイルは個人の参戦記録そのもの（いつ・どこへ行ったか）を含むため、
リポジトリにはコミットしていません**（`.gitignore` 済み）。手元にだけ置いてください。

変換の要点は次のとおりです。

- MySQL の `live_schedules` を Postgres の `lives` へ
- `user_id` は連番ではなく `auth.users` からメールアドレスで引く
- 制覇マップ用に `prefecture_code` を会場名から補完
- 同じアーティスト・タイトル・日付の行は挿入しないため、何度実行しても重複しない

---

## 6. スマホアプリとして使う

ルートの `icon.png` がアプリアイコンのマスターです。ここから各サイズを生成しています。

- **iPhone**: Safari で開く → 共有 → 「ホーム画面に追加」
- **Android**: Chrome で開く → メニュー → 「アプリをインストール」

ホーム画面から起動するとアドレスバーのない全画面（standalone）で開き、
下部のタブバーでライブ一覧 / 制覇マップ / 統計を行き来できます。

アイコンを差し替えるときは、ルートの `icon.png` を新しい画像に置き換えて次を実行します（macOS）。

```bash
bash scripts/generate-icons.sh
```

---

## 7. コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動する |
| `npm run build` | 本番ビルド |
| `npm start` | ビルド結果を起動する |
| `npm run lint` | ESLint |
| `node scripts/generate-japan-geo.mjs` | 日本地図のパスデータを再生成する |
| `bash scripts/generate-icons.sh` | `icon.png` から各サイズのアイコンを生成する |

---

## 8. ライセンス / クレジット

日本地図の県境パスデータは [@svg-maps/japan](https://github.com/VictorCazanave/svg-maps)（MIT License）を使用しています。
