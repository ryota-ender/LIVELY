"use server";

import { revalidatePath } from "next/cache";

import type { LiveFormState } from "@/lib/live-form-state";
import { createClient } from "@/lib/supabase/server";

function fail(prev: LiveFormState, error: string): LiveFormState {
  return { submitted: prev.submitted + 1, ok: false, error };
}

function succeed(prev: LiveFormState): LiveFormState {
  return { submitted: prev.submitted + 1, ok: true };
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * アーティストの設定を保存する。
 * 行がまだ無ければ作り、あれば更新する（名前で 1 行）。
 */
export async function saveArtistSettings(
  prev: LiveFormState,
  formData: FormData,
): Promise<LiveFormState> {
  const name = str(formData, "name");
  if (!name) return fail(prev, "アーティスト名が指定されていません。");
  if (name.length > 100) return fail(prev, "アーティスト名は 100 文字以内で入力してください。");

  const fanSince = str(formData, "fanSince");
  if (fanSince && !/^\d{4}-\d{2}-\d{2}$/.test(fanSince)) {
    return fail(prev, "応援開始日の形式が正しくありません。");
  }

  const url = str(formData, "url");
  if (url && !/^https?:\/\//.test(url)) {
    return fail(prev, "リンクは http:// または https:// で始めてください。");
  }
  if (url.length > 500) return fail(prev, "リンクが長すぎます。");

  const memo = String(formData.get("memo") ?? "").trim();
  if (memo.length > 2000) return fail(prev, "メモは 2000 文字以内で入力してください。");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(prev, "ログインし直してください。");

  const { error } = await supabase.from("artists").upsert(
    {
      user_id: user.id,
      name,
      fan_since: fanSince || null,
      memo: memo || null,
      url: url || null,
    },
    { onConflict: "user_id,name" },
  );

  if (error) return fail(prev, `保存に失敗しました: ${error.message}`);

  revalidatePath("/artists");
  revalidatePath("/lives");
  return succeed(prev);
}

/** 設定を消す（ライブ記録は消さない） */
export async function clearArtistSettings(
  prev: LiveFormState,
  formData: FormData,
): Promise<LiveFormState> {
  const name = str(formData, "name");
  if (!name) return fail(prev, "アーティスト名が指定されていません。");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(prev, "ログインし直してください。");

  const { error } = await supabase
    .from("artists")
    .delete()
    .eq("user_id", user.id)
    .eq("name", name);

  if (error) return fail(prev, `削除に失敗しました: ${error.message}`);

  revalidatePath("/artists");
  revalidatePath("/lives");
  return succeed(prev);
}
