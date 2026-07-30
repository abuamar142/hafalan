import { SkeletonLine } from '@cloudflare/kumo'

export default function RiwayatLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-2">
        <SkeletonLine maxWidth={140} blockHeight="20px" />
      </div>

      {/* Search & Filters Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SkeletonLine maxWidth={400} blockHeight="40px" className="min-w-0 flex-[2]" />
        <SkeletonLine maxWidth={180} blockHeight="40px" className="w-full sm:w-44 shrink-0" />
        <SkeletonLine maxWidth={180} blockHeight="40px" className="w-full sm:w-44 shrink-0" />
        <SkeletonLine maxWidth={160} blockHeight="40px" className="w-full sm:w-40 shrink-0" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-md bg-card p-3.5 border border-border/50 flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            {/* Left: Info */}
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine maxWidth={180} blockHeight="16px" />
              <SkeletonLine maxWidth={220} blockHeight="12px" />
              <SkeletonLine blockHeight="14px" className="max-w-md mt-1" />
            </div>

            {/* Right: Metadata */}
            <div className="mt-2 flex flex-row items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
              <SkeletonLine maxWidth={55} blockHeight="20px" className="!rounded-full" />
              <SkeletonLine maxWidth={100} blockHeight="14px" />
              <SkeletonLine maxWidth={140} blockHeight="12px" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <SkeletonLine maxWidth={100} blockHeight="32px" />
        <SkeletonLine maxWidth={36} blockHeight="32px" />
        <SkeletonLine maxWidth={36} blockHeight="32px" />
        <SkeletonLine maxWidth={100} blockHeight="32px" />
      </div>
    </div>
  )
}
