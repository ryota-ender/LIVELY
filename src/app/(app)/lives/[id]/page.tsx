import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { SetupError } from "@/components/SetupError";
import { TicketIcon } from "@/components/icons";
import { LiveDetailView } from "@/components/lives/LiveDetailView";
import { distinctArtists, distinctVenues } from "@/lib/filters";
import { todayInTokyo } from "@/lib/format";
import { loadLive, loadLives } from "@/lib/lives";

export const metadata: Metadata = { title: "ライブの詳細" };

export default async function LiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await loadLive(id);
  if (!result.ok) {
    return (
      <main>
        <PageHeader title="ライブの詳細" icon={TicketIcon} />
        <SetupError error={result} />
      </main>
    );
  }
  if (!result.data) notFound();

  // 編集フォームの入力候補（表記ゆれ防止）
  const all = await loadLives();
  const lives = all.ok ? all.data : [];

  return (
    <LiveDetailView
      live={result.data}
      today={todayInTokyo()}
      artistOptions={distinctArtists(lives)}
      venueOptions={distinctVenues(lives)}
    />
  );
}
