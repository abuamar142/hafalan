import { Card, CardContent } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-2 space-y-2">
        <div className="h-8 w-36 rounded-md bg-border/60" />
        <div className="h-4 w-60 rounded-md bg-border/40" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/30 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-border/50" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 rounded bg-border/40" />
                <div className="h-6 w-12 rounded bg-border/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Section Skeleton */}
      <Card className="border-border/30 shadow-sm">
        <div className="p-5 border-b border-border/50 flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-border/50" />
          <div className="h-5 w-36 rounded bg-border/60" />
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                {/* Rank Circle */}
                <div className="h-8 w-8 shrink-0 rounded-full bg-border/50" />
                {/* Info */}
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="h-4 w-32 rounded bg-border/60" />
                    <div className="h-4 w-12 rounded bg-border/50" />
                  </div>
                  {/* Progress bar line */}
                  <div className="h-2 w-full rounded bg-border/40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
