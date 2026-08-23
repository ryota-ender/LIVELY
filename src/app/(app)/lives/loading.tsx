import { PageHeader } from "@/components/PageHeader";
import { TicketIcon } from "@/components/icons";
import { Skeleton, StatTilesSkeleton } from "@/components/Skeleton";

export default function LivesLoading() {
  return (
    <main>
      <PageHeader title="ライブ一覧" icon={TicketIcon} />

      <StatTilesSkeleton />

      <div className="panel mb-4 px-4 py-3">
        <Skeleton className="h-7 w-24" />
      </div>

      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="panel flex items-start gap-3 p-4">
            <div className="shrink-0 space-y-1.5">
              <Skeleton className="h-2 w-8" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
