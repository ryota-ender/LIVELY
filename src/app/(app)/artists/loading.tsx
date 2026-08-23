import { PageHeader } from "@/components/PageHeader";
import { Skeleton, StatTilesSkeleton } from "@/components/Skeleton";
import { HeartIcon } from "@/components/icons";

export default function ArtistsLoading() {
  return (
    <main>
      <PageHeader title="アーティスト" icon={HeartIcon} />

      <StatTilesSkeleton />

      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="panel p-4">
            <Skeleton className="h-4 w-40" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j}>
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="mt-1.5 h-3 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-3 h-7 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
