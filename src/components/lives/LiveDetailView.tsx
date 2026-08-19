"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronLeftIcon, TrashIcon } from "@/components/icons";
import type { LiveWithImage } from "@/lib/types";

import { DeleteLiveForm } from "./DeleteLiveForm";
import { LiveDetail } from "./LiveDetail";
import { LiveForm } from "./LiveForm";

type Mode = "view" | "edit" | "delete";

/** 詳細ページ本体。表示 / 編集 / 削除確認を切り替える */
export function LiveDetailView({
  live,
  today,
  artistOptions,
  venueOptions,
}: {
  live: LiveWithImage;
  today: string;
  artistOptions: string[];
  venueOptions: string[];
}) {
  const [mode, setMode] = useState<Mode>("view");

  return (
    <main>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/lives" className="btn btn-ghost px-2.5 py-1.5 text-xs">
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          一覧
        </Link>
        <h1 className="text-lg font-black">
          {mode === "edit" ? "ライブを編集" : mode === "delete" ? "削除の確認" : "ライブの詳細"}
        </h1>
      </div>

      <div className="panel p-4 sm:p-5">
        {mode === "view" ? (
          <>
            <LiveDetail live={live} today={today} />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-danger mr-auto"
                onClick={() => setMode("delete")}
              >
                <TrashIcon className="h-4 w-4" />
                削除
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setMode("edit")}>
                編集
              </button>
            </div>
          </>
        ) : mode === "edit" ? (
          <LiveForm
            live={live}
            onSaved={() => setMode("view")}
            onCancel={() => setMode("view")}
            artistOptions={artistOptions}
            venueOptions={venueOptions}
          />
        ) : (
          <DeleteLiveForm live={live} onCancel={() => setMode("view")} />
        )}
      </div>
    </main>
  );
}
