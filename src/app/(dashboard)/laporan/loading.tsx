export default function LaporanLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-border/60" />
        <div className="h-4 w-64 rounded-md bg-border/40" />
      </div>

      {/* Report Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card border border-border/40 rounded-lg p-6 space-y-4 animate-pulse"
          >
            <div className="w-12 h-12 rounded-full bg-border/50" />
            <div className="h-5 w-32 rounded bg-border/50" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-border/40" />
              <div className="h-3 w-3/4 rounded bg-border/40" />
            </div>
            <div className="h-9 w-24 rounded-md bg-border/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
