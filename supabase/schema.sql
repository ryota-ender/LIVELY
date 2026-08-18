-- =============================================================
-- LIVELY - Supabase スキーマ定義
-- Supabase ダッシュボードの SQL Editor にそのまま貼り付けて実行してください。
-- （何度実行しても同じ結果になるように書いています）
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- ライブ記録テーブル
-- -------------------------------------------------------------
create table if not exists public.lives (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,

  artist_name     text not null check (char_length(artist_name) between 1 and 100),
  co_artists      text[] not null default '{}',
  live_title      text not null check (char_length(live_title) between 1 and 150),
  live_date       date not null,
  open_time       time,
  start_time      time,

  venue           text check (char_length(venue) <= 150),
  -- JIS 都道府県コード（'01' 〜 '47'）
  prefecture_code text check (prefecture_code ~ '^(0[1-9]|[1-3][0-9]|4[0-7])$'),

  live_type       text check (live_type in ('oneman', 'taiban', 'fes')),
  memo            text check (char_length(memo) <= 5000),
  setlist         text check (char_length(setlist) <= 5000),
  -- Storage バケット live-images 内のパス（例: <user_id>/<uuid>.jpg）
  image_path      text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists lives_user_date_idx on public.lives (user_id, live_date desc);
create index if not exists lives_user_artist_idx on public.lives (user_id, artist_name);
create index if not exists lives_user_pref_idx on public.lives (user_id, prefecture_code);

-- -------------------------------------------------------------
-- updated_at 自動更新
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lives_set_updated_at on public.lives;
create trigger lives_set_updated_at
  before update on public.lives
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 行レベルセキュリティ（自分のライブ記録だけ読み書きできる）
-- -------------------------------------------------------------
alter table public.lives enable row level security;

drop policy if exists "lives_select_own" on public.lives;
create policy "lives_select_own" on public.lives
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "lives_insert_own" on public.lives;
create policy "lives_insert_own" on public.lives
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "lives_update_own" on public.lives;
create policy "lives_update_own" on public.lives
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "lives_delete_own" on public.lives;
create policy "lives_delete_own" on public.lives
  for delete to authenticated
  using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- 画像用ストレージ（非公開バケット / 署名付き URL で配信）
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'live-images',
  'live-images',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 自分の user_id 名のフォルダ配下だけを読み書きできるようにする。
--
-- ここから下で "must be owner of table objects" のようなエラーが出る場合は、
-- SQL Editor ではなくダッシュボードの Storage → live-images → Policies から
-- 同じ条件（bucket_id = 'live-images' かつ (storage.foldername(name))[1] = auth.uid()::text）で
-- select / insert / update / delete のポリシーを作成してください。
drop policy if exists "live_images_select_own" on storage.objects;
create policy "live_images_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'live-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "live_images_insert_own" on storage.objects;
create policy "live_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'live-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "live_images_update_own" on storage.objects;
create policy "live_images_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'live-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "live_images_delete_own" on storage.objects;
create policy "live_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'live-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
