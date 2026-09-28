import Link from "next/link";

import { Skeleton } from "@/components/Skeleton";
import { ChevronLeftIcon } from "@/components/icons";

/** カードをタップした直後に出す仮の詳細画面（読み込みを待たずに画面を切り替える） */
export default function LiveDetailLoading() {
  return (
    <main>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/lives" className="btn btn-ghost px-2.5 py-1.5 text-xs">
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          一覧
        </Link>
        <h1 className="text-lg font-black">ライブの詳細</h1>
      </div>

      <div className="panel p-4 sm:p-5">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-line-soft py-2.5 last:border-b-0"
          >
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className={`h-4 ${i % 3 === 0 ? "w-2/3" : i % 3 === 1 ? "w-1/2" : "w-5/6"}`} />
          </div>
        ))}
      </div>
    </main>
  );
}
