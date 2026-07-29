export default function RiwayatLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-2">
        <div className="h-5 w-32 rounded bg-border/60" />
      </div>

      {/* Search & Filters Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="h-10 min-w-0 flex-[2] rounded-lg bg-border/40" />
        <div className="h-10 w-full sm:w-44 rounded-lg bg-border/40 shrink-0" />
        <div className="h-10 w-full sm:w-44 rounded-lg bg-border/40 shrink-0" />
        <div className="h-10 w-full sm:w-40 rounded-lg bg-border/40 shrink-0" />
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
              <div className="h-4 w-40 rounded bg-border/60" />
              <div className="h-3 w-48 rounded bg-border/45" />
              <div className="h-3.5 w-full max-w-md rounded bg-border/30 mt-1" />
            </div>

            {/* Right: Metadata */}
            <div className="mt-2 flex flex-row items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
              <div className="h-5 w-12 rounded-full bg-border/50" />
              <div className="h-3.5 w-24 rounded bg-border/40" />
              <div className="h-3 w-32 rounded bg-border/35" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="h-8 w-24 rounded bg-border/40" />
        <div className="h-8 w-8 rounded bg-border/50" />
        <div className="h-8 w-8 rounded bg-border/50" />
        <div className="h-8 w-24 rounded bg-border/40" />
      </div>
    </div>
  )
}
