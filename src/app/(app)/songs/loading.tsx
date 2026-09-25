import { PageHeader } from "@/components/PageHeader";
import { Skeleton, StatTilesSkeleton } from "@/components/Skeleton";

export default function SongsLoading() {
  return (
    <main>
      <PageHeader title="聴いた曲" />
      <StatTilesSkeleton />
      <div className="panel divide-y divide-line-soft">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="h-3 w-5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </main>
  );
}
