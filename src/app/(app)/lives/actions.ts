"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { LiveFormState } from "@/lib/live-form-state";
import { isPrefectureCode } from "@/lib/prefectures";
import { IMAGE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { isLiveType } from "@/lib/types";

type LiveValues = {
  artist_name: string;
  co_artists: string[];
  live_title: string;
  live_date: string;
  open_time: string | null;
  start_time: string | null;
  venue: string | null;
  prefecture_code: string | null;
  live_type: string | null;
  memo: string | null;
  setlist: string | null;
  image_path: string | null;
};

function fail(prev: LiveFormState, error: string): LiveFormState {
  return { submitted: prev.submitted + 1, ok: false, error };
}

function succeed(prev: LiveFormState): LiveFormState {
  return { submitted: prev.submitted + 1, ok: true };
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullable(value: string): string | null {
  return value === "" ? null : value;
}

/** フォームの値を検証して、DB に入れる形に整える */
function parseForm(formData: FormData): { values: LiveValues } | { error: string } {
  const artistName = str(formData, "artistName");
  const liveTitle = str(formData, "liveTitle");
  const liveDate = str(formData, "liveDate");

  if (!artistName) return { error: "アーティスト名を入力してください。" };
  if (artistName.length > 100) return { error: "アーティスト名は 100 文字以内で入力してください。" };

  // 共演アーティストは同名の入力欄が複数あるので getAll で受け取る。
  // 空欄・メインとの重複・共演どうしの重複は落とす。
  const coArtists = [
    ...new Set(
      formData
        .getAll("coArtists")
        .map((value) => String(value).trim())
        .filter((value) => value !== "" && value !== artistName),
    ),
  ];
  if (coArtists.some((name) => name.length > 100)) {
    return { error: "アーティスト名は 100 文字以内で入力してください。" };
  }
  if (!liveTitle) return { error: "ライブタイトルを入力してください。" };
  if (liveTitle.length > 150) return { error: "ライブタイトルは 150 文字以内で入力してください。" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(liveDate)) return { error: "開催日を入力してください。" };

  const openTime = str(formData, "openTime");
  const startTime = str(formData, "startTime");
  const timePattern = /^\d{2}:\d{2}$/;
  if (openTime && !timePattern.test(openTime)) return { error: "開場時間の形式が正しくありません。" };
  if (startTime && !timePattern.test(startTime)) return { error: "開演時間の形式が正しくありません。" };

  const venue = str(formData, "venue");
  if (venue.length > 150) return { error: "会場名は 150 文字以内で入力してください。" };

  const prefectureCode = str(formData, "prefectureCode");
  if (prefectureCode && !isPrefectureCode(prefectureCode)) {
    return { error: "都道府県の指定が正しくありません。" };
  }

  const liveType = str(formData, "liveType");
  if (liveType && !isLiveType(liveType)) return { error: "種別の指定が正しくありません。" };

  const memo = String(formData.get("memo") ?? "");
  const setlist = String(formData.get("setlist") ?? "");
  if (memo.length > 5000) return { error: "メモは 5000 文字以内で入力してください。" };
  if (setlist.length > 5000) return { error: "セットリストは 5000 文字以内で入力してください。" };

  return {
    values: {
      artist_name: artistName,
      co_artists: coArtists,
      live_title: liveTitle,
      live_date: liveDate,
      open_time: nullable(openTime),
      start_time: nullable(startTime),
      venue: nullable(venue),
      prefecture_code: nullable(prefectureCode),
      live_type: nullable(liveType),
      memo: nullable(memo.trim()),
      setlist: nullable(setlist.trim()),
      image_path: nullable(str(formData, "imagePath")),
    },
  };
}

function revalidateAll() {
  revalidatePath("/lives");
  revalidatePath("/map");
  revalidatePath("/stats");
}

/** 画像をストレージから削除する（失敗しても本処理は続行する） */
async function removeImages(paths: Array<string | null | undefined>) {
  const targets = paths.filter((p): p is string => Boolean(p));
  if (targets.length === 0) return;

  const supabase = await createClient();
  await supabase.storage.from(IMAGE_BUCKET).remove(targets);
}

export async function createLive(
  prev: LiveFormState,
  formData: FormData,
): Promise<LiveFormState> {
  const parsed = parseForm(formData);
  if ("error" in parsed) return fail(prev, parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(prev, "ログインし直してください。");

  const { error } = await supabase.from("lives").insert({ ...parsed.values, user_id: user.id });

  if (error) {
    await removeImages([parsed.values.image_path]);
    return fail(prev, `登録に失敗しました: ${error.message}`);
  }

  revalidateAll();
  return succeed(prev);
}

export async function updateLive(
  prev: LiveFormState,
  formData: FormData,
): Promise<LiveFormState> {
  const id = str(formData, "id");
  if (!id) return fail(prev, "更新対象が見つかりません。");

  const parsed = parseForm(formData);
  if ("error" in parsed) return fail(prev, parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(prev, "ログインし直してください。");

  // 差し替え・削除された古い画像を消すために、更新前のパスを控えておく
  const { data: current } = await supabase
    .from("lives")
    .select("image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("lives")
    .update(parsed.values)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(prev, `更新に失敗しました: ${error.message}`);

  const oldPath = current?.image_path ?? null;
  if (oldPath && oldPath !== parsed.values.image_path) {
    await removeImages([oldPath]);
  }

  revalidateAll();
  return succeed(prev);
}

export async function deleteLive(prev: LiveFormState, formData: FormData): Promise<LiveFormState> {
  const id = str(formData, "id");
  if (!id) return fail(prev, "削除対象が見つかりません。");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(prev, "ログインし直してください。");

  const { data: current } = await supabase
    .from("lives")
    .select("image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("lives").delete().eq("id", id).eq("user_id", user.id);

  if (error) return fail(prev, `削除に失敗しました: ${error.message}`);

  await removeImages([current?.image_path]);

  revalidateAll();
  // 詳細ページから消したので一覧へ戻す
  redirect("/lives");
}
