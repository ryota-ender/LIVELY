import { PageHeader } from "@/components/PageHeader";
import { ChartIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";

export default function StatsLoading() {
  return (
    <main>
      <PageHeader title="統計" icon={ChartIcon} />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="panel px-4 py-3.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="mt-2 h-6 w-10" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="panel p-4">
            <Skeleton className="mb-3 h-3.5 w-28" />
            <Skeleton className="h-36 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
