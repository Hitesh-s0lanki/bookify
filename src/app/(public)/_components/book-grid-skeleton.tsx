import { Skeleton } from "@/components/ui/skeleton";

export function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border bg-card"
        >
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
