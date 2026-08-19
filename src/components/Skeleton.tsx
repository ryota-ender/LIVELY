/** 読み込み中のプレースホルダ。実際の要素とほぼ同じ大きさにして、表示時のガタつきを防ぐ */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/8 ${className}`} />;
}

/** 上部に並ぶ数値タイル 3 枚分 */
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel px-4 py-3.5">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="mt-2 h-6 w-10" />
        </div>
      ))}
    </div>
  );
}
