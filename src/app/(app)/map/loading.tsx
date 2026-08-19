import { PageHeader } from "@/components/PageHeader";
import { MapPinIcon } from "@/components/icons";
import { Skeleton, StatTilesSkeleton } from "@/components/Skeleton";

export default function MapLoading() {
  return (
    <main>
      <PageHeader title="都道府県 制覇マップ" icon={MapPinIcon} />

      <div className="panel mb-4 px-4 py-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="mt-2 h-9 w-24" />
        <Skeleton className="mt-3 h-2.5 w-full" />
      </div>

      <StatTilesSkeleton />

      <div className="panel p-4 sm:p-6">
        {/* 日本地図と同じ縦横比で場所を確保しておく */}
        <Skeleton className="mx-auto aspect-[446/524] w-full max-w-2xl" />
      </div>
    </main>
  );
}
