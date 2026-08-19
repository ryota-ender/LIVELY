-- =============================================================
-- LivePlan（MySQL）のライブ記録を LIVELY（Supabase）へ取り込む
--
-- 【使い方】
--   1. 先に supabase/schema.sql を実行しておく
--   2. アプリでアカウントを作成しておく
--   3. 【手順 1】を実行して、自分のメールアドレスを確認する
--   4. 【手順 2】の 'ここにメールアドレス' を書き換えて実行する
--
-- 何度実行しても重複しません（同じアーティスト・タイトル・日付の行は挿入しません）。
--
-- 【元データからの変更点】
--   - live_schedules → lives。user_id は連番ではなく auth.users から引く
--   - prefecture_code を会場名から補った（制覇マップ用。全 51 件・8 都道府県）
--   - 元ファイルで引用符が抜けていた memo（日本武道館公演発表）を文字列として修正
--   - 会場が空文字だった 1 件（OSAKA GIGANTIC MUSIC FESTIVAL）は会場を NULL、
--     都道府県は大会名から大阪府とした
--   - live_type と co_artists は元データに無いため未設定（アプリ上で編集できます）
--   - users テーブルの admin アカウントは移行しない（認証は Supabase Auth が担当）
-- =============================================================


-- -------------------------------------------------------------
-- 【手順 1】自分のメールアドレスを確認する
--
-- Supabase はメールアドレスを小文字で保存します。
-- ここに表示された値をそのままコピーして、下の【手順 2】に貼ってください。
-- -------------------------------------------------------------
select id, email, created_at from auth.users order by created_at;


-- -------------------------------------------------------------
-- 【手順 2】取り込む
--
-- 実行すると「該当ユーザー数」と「追加件数」が返ります。
--   該当ユーザー数 = 0 → メールアドレスが一致していません（手順 1 を確認）
--   追加件数 = 0 かつ 該当ユーザー数 = 1 → すでに取り込み済みです
-- -------------------------------------------------------------
with target as (
  select id
    from auth.users
   where email = 'ここにメールアドレス'
),
source (artist_name, live_title, live_date, open_time, start_time, venue, prefecture_code, memo) as (
  values
    ('SEKAI NO OWARI'::text, 'SUMMER SONIC 2023 OSAKA'::text, '2023-08-20'::text, '10:00:00'::text, '11:30:00'::text, '舞洲ソニックパーク'::text, '27'::text, 'ずっと真夜中でいいのに。'::text),
    ('SEKAI NO OWARI', 'SPACE SHOWER SWEET LOVE SHOWER 2023', '2023-08-26', '09:00:00', '10:30:00', '山中湖交流プラザ きらら', '19', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ARENA TOUR 2024 「深海」', '2024-04-06', '17:00:00', '18:00:00', 'エコパアリーナ', '22', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ARENA TOUR 2024 「深海」', '2024-04-07', '16:00:00', '17:00:00', 'エコパアリーナ', '22', null),
    ('ずっと真夜中でいいのに。', '本格中華喫茶・愛のペガサス~羅武の香辛龍~', '2024-05-04', '17:00:00', '18:30:00', 'Kアリーナ横浜', '14', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ARENA TOUR 2024 「深海」', '2024-05-06', '16:00:00', '17:00:00', '国立代々木競技場 第一体育館', '13', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ARENA TOUR 2024 「深海」', '2024-06-01', '17:00:00', '18:00:00', 'さいたまスーパーアリーナ', '11', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ARENA TOUR 2024 「深海」', '2024-08-12', '15:00:00', '16:30:00', 'Kアリーナ横浜', '14', null),
    ('ずっと真夜中でいいのに。', 'やきやきヤンキーツアー2~スナネコ建設の磨き仕上げ~', '2024-10-09', '17:30:00', '18:30:00', '大宮ソニックシティ 大ホール', '11', null),
    ('ずっと真夜中でいいのに。', 'YAKI YAKI YANKEE TOUR 続 「名巧は愚なるが如し」', '2025-03-29', '17:00:00', '18:30:00', 'ぴあアリーナMM', '14', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI FUNCLUB TOUR 2025 「INSTANTRADIO」', '2025-05-14', '17:30:00', '19:00:00', 'KT Zepp Yokohama', '14', null),
    ('ずっと真夜中でいいのに。', 'YAKI YAKI YANKEE TOUR 続 「名巧は愚なるが如し」', '2025-05-18', '15:00:00', '16:30:00', '国立代々木競技場 第一体育館', '13', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI FUNCLUB TOUR 2025 「INSTANTRADIO」', '2025-06-24', '17:30:00', '19:00:00', 'Zepp DiverCity (TOKYO)', '13', null),
    ('SEKAI NO OWARI', 'NUMBER SHOT2025', '2025-07-21', '08:30:00', '10:30:00', 'みずほpaypayドーム', '40', 'あいみょん、ヤバイTシャツ屋さん、SUPER BEAVER'),
    ('SEKAI NO OWARI', 'SPACE SHOWER SWEET LOVE SHOWER 2025 30th ANNIVERSARY', '2025-08-31', '09:00:00', '10:00:00', '山中湖交流プラザ きらら', '19', null),
    ('ずっと真夜中でいいのに。', 'オモテEXPO 2025 「名巧は愚なるが如し」', '2025-09-02', '17:45:00', '19:00:00', 'EXPO アリーナ「Matsuri」', '27', null),
    ('SEKAI NO OWARI', 'ROCK IN JAPAN FESTIVAL 2025', '2025-09-13', '08:30:00', '11:45:00', '千葉市蘇我スポーツ公園', '12', null),
    ('ずっと真夜中でいいのに。', '平日プレミアム 「コズミックどろ団子ツアー」', '2025-09-24', '18:00:00', '19:00:00', '府中の森芸術劇場 どりーむホール', '13', null),
    ('ヨルシカ', 'ヨルシカ LIVE TOUR 2025 「盗作 再演」', '2025-09-30', '17:30:00', '19:00:00', 'Kアリーナ横浜', '14', null),
    ('緑黄色社会', 'COSMIC CIRCUS Vol.3', '2025-10-07', '18:00:00', '19:00:00', 'Zepp Haneda (TOKYO)', '13', 'Aqua Timez'),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI ASIA TOUR 2025 「Phoenix」 in TOKYO', '2025-11-17', '18:00:00', '19:00:00', 'NHKホール', '13', null),
    ('Aooo', 'Aooo Special Live 2025 "Bazoooka"', '2025-12-06', '16:00:00', '17:00:00', '東京ガーデンシアター', '13', null),
    ('Tele', 'Tele Tour 2025 - 2026 「蟲」', '2025-12-13', '16:00:00', '17:30:00', '幕張メッセ 国際展示場9・10・11ホール', '12', null),
    ('ずっと真夜中でいいのに。', '平日プレミアム 「コズミックどろ団子ツアー」', '2025-12-23', '18:00:00', '19:00:00', '東京ガーデンシアター', '13', null),
    ('SEKAI NO OWARI', 'UVERworld VSシリーズ "UVERworld vs SEKAI NO OWARI"', '2025-12-26', '17:00:00', '18:00:00', '日本武道館', '13', 'UVERworld'),
    ('ずっと真夜中でいいのに。', 'COUNTDOWN JAPAN 25/26', '2025-12-31', '12:30:00', '14:40:00', '幕張メッセ国際展示場ホール', '12', 'THE ORAL CIGARETTES、Tele'),
    ('wacci', 'wacci Hall Tour 2025-2026 ~憧憬~', '2026-01-10', '16:00:00', '17:00:00', '昭和女子大学 人見記念講堂', '13', null),
    ('ずっと真夜中でいいのに。', 'JAPAN ＆ ASIA TOUR ZUTOMAYO INTENSEⅡ「坐・ZOMBIE CRAB LABO」', '2026-03-01', '16:45:00', '18:00:00', '日本武道館', '13', null),
    ('tuki.', 'NIPPON BUDOKAN ~承認欲求爆発~ 追加公演', '2026-03-11', '18:00:00', '19:00:00', 'Zepp Haneda(TOKYO)', '13', null),
    ('tuki.', 'NIPPON BUDOKAN ~承認欲求爆発~ 追加公演', '2026-03-12', '18:00:00', '19:00:00', 'Zepp Haneda(TOKYO)', '13', null),
    ('ずっと真夜中でいいのに。', 'JAPAN ＆ ASIA TOUR ZUTOMAYO INTENSEⅡ「坐・ZOMBIE CRAB LABO」', '2026-03-28', '17:00:00', '18:30:00', 'マリンメッセ福岡B館', '40', '追加公演'),
    ('Aooo', 'CENTRAL MUSIC & ENTERTAINMENT FESTIVAL 2026', '2026-04-05', '11:00:00', '12:30:00', '横浜赤レンガ倉庫 赤レンガパーク特設会場', '14', null),
    ('秘めごと', '秘めごと 単独公演 「狼煙」', '2026-04-25', '17:00:00', '18:00:00', '東京キネマ倶楽部', '13', null),
    ('にしな', 'にしなツアー2026 「日々散漫」', '2026-05-14', '18:00:00', '19:00:00', 'Spotify O-EAST', '13', '追加公演'),
    ('秘めごと', 'Himegoto presents [count sheep]5匹目', '2026-05-16', '18:00:00', '18:30:00', '下北沢CLUB251', '13', 'broken my toybox'),
    ('Aooo', 'Aooo Live Tour "RINGRING"', '2026-05-29', '18:00:00', '19:00:00', 'Zepp Haneda(TOKYO)', '13', '日本武道館公演発表'),
    ('ずっと真夜中でいいのに。', 'JAPAN ＆ ASIA TOUR ZUTOMAYO INTENSEⅡ「坐・ZOMBIE CRAB LABO」', '2026-06-02', '17:30:00', '19:00:00', 'Kアリーナ横浜', '14', null),
    ('ずっと真夜中でいいのに。', 'JAPAN ＆ ASIA TOUR ZUTOMAYO INTENSEⅡ「坐・ZOMBIE CRAB LABO」', '2026-06-03', '17:30:00', '19:00:00', 'Kアリーナ横浜', '14', null),
    ('PompadollS', 'PompadollS One Man Tour 「SOUND OF ROCK」', '2026-06-06', '17:00:00', '18:00:00', 'Zepp Shinjuku', '13', null),
    ('秘めごと', 'NEWAGE', '2026-06-18', '18:30:00', '19:00:00', 'Shibuya Milkyway', '13', 'Klang Ruler、セブンス・ベガ'),
    ('Pixie Monster', 'U.N.I.Z.O.N.E', '2026-06-20', '17:00:00', '17:30:00', 'Shibuya WWW', '13', 'お風呂と街灯、永井琳子、えんどあ。'),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI DOME TOUR 2026 「THE CINEMA」', '2026-07-11', '16:00:00', '18:00:00', '京セラドーム', '27', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI DOME TOUR 2026 「THE CINEMA」', '2026-07-12', '15:00:00', '17:00:00', '京セラドーム', '27', null),
    ('THE ORAL CIGARETTES', 'Home Sweet Home TOUR 2026', '2026-07-22', '18:00:00', '19:00:00', '東京ガーデンシアター', '13', null),
    ('ずっと真夜中でいいのに。', 'OSAKA GIGANTIC MUSIC FESTIVAL 2026 -THANKS 10 TH GIGA-', '2026-08-02', '11:00:00', '00:00:00', null, '27', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI DOME TOUR 2026 「THE CINEMA」', '2026-08-15', '16:00:00', '18:00:00', '東京ドーム', '13', null),
    ('SEKAI NO OWARI', 'SEKAI NO OWARI DOME TOUR 2026 「THE CINEMA」', '2026-08-16', '16:00:00', '18:00:00', '東京ドーム', '13', null),
    ('iCO', 'iCO 2nd ONE-MAN TOUR 「カクリヨ」', '2026-08-22', '17:00:00', '18:00:00', 'duo MUSIC EXCHANGE', '13', null),
    ('harha', 'harha one man live tour ON YOUR MARKS!', '2026-10-04', '17:00:00', '18:00:00', 'Spotify O-EAST', '13', null),
    ('THE ORAL CIGARETTES', 'BKW!! PREMIUM Party ~THINK OUT LOUD~', '2026-10-12', '15:30:00', '17:00:00', '東京ガーデンシアター', '13', null),
    ('BUMP OF CHICKEN', 'BUMP OF CHIKEN TOUR 2026-2027 Ratio Clavis', '2027-02-06', '16:00:00', '18:00:00', '東京ドーム', '13', '追加公演')
),
inserted as (
  insert into public.lives (
    user_id, artist_name, live_title, live_date, open_time, start_time, venue, prefecture_code, memo
  )
  select
    t.id,
    s.artist_name,
    s.live_title,
    s.live_date::date,
    s.open_time::time,
    s.start_time::time,
    s.venue,
    s.prefecture_code,
    s.memo
  from target t
  cross join source s
  where not exists (
    select 1
      from public.lives l
     where l.user_id = t.id
       and l.artist_name = s.artist_name
       and l.live_title = s.live_title
       and l.live_date = s.live_date::date
  )
  returning 1
)
select
  (select count(*) from target)   as 該当ユーザー数,
  (select count(*) from inserted) as 追加件数;


-- -------------------------------------------------------------
-- 【手順 3】結果を確認する（メールアドレスの書き換えは不要）
--
-- 取り込んだアカウントが 51 件・8 都道府県になっていれば成功です。
-- -------------------------------------------------------------
select u.email, count(l.id) as 件数, count(distinct l.prefecture_code) as 都道府県数
  from auth.users u
  left join public.lives l on l.user_id = u.id
 group by u.email
 order by u.email;


-- =============================================================
-- ここから下は「任意」です。元データをそのまま入れるだけなら実行不要。
-- 実行したい場合だけ、対象の文を選択して Run してください。
-- =============================================================

-- 【任意 1】memo に入っている共演アーティストを co_artists へ移す
--
-- 旧アプリには共演アーティスト欄が無く、memo に代用されていた行があります。
-- （例：'あいみょん、ヤバイTシャツ屋さん、SUPER BEAVER'）
-- co_artists に移すと、統計のアーティスト別ランキングにも数えられるようになります。
-- '追加公演' などの本来のメモは対象外にしています。
--
-- update public.lives
--    set co_artists = coalesce(regexp_split_to_array(memo, '\s*[、,]\s*'), '{}'),
--        memo = null
--  where user_id = (select id from auth.users where email = 'ここにメールアドレス')
--    and memo is not null
--    and memo not in ('追加公演', '日本武道館公演発表');


-- 【任意 2】会場名の表記ゆれを揃える
--
-- 元データには 'Zepp Haneda (TOKYO)'（空白あり）と 'Zepp Haneda(TOKYO)'（空白なし）が
-- 混在しています。統計の会場別ランキングは文字列の完全一致で数えるため、
-- 揃えておくと 1 つの会場としてまとまります。
--
-- update public.lives
--    set venue = 'Zepp Haneda (TOKYO)'
--  where user_id = (select id from auth.users where email = 'ここにメールアドレス')
--    and venue = 'Zepp Haneda(TOKYO)';
