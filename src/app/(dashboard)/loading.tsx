import { SkeletonLine } from '@cloudflare/kumo'
import { Card, CardContent } from '@/components/ui/Card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-2 space-y-2">
        <SkeletonLine maxWidth={150} blockHeight="32px" />
        <SkeletonLine maxWidth={250} blockHeight="16px" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/30 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <SkeletonLine maxWidth={48} blockHeight="48px" className="!rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonLine maxWidth={80} blockHeight="16px" />
                <SkeletonLine maxWidth={60} blockHeight="24px" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Section Skeleton */}
      <Card className="border-border/30 shadow-sm">
        <div className="p-5 border-b border-border/50 flex items-center gap-2">
          <SkeletonLine maxWidth={20} blockHeight="20px" />
          <SkeletonLine maxWidth={150} blockHeight="20px" />
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                {/* Rank Circle */}
                <SkeletonLine maxWidth={32} blockHeight="32px" className="!rounded-full shrink-0" />
                {/* Info */}
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <SkeletonLine minWidth={100} maxWidth={180} blockHeight="16px" />
                    <SkeletonLine minWidth={30} maxWidth={60} blockHeight="16px" />
                  </div>
                  {/* Progress bar line */}
                  <SkeletonLine blockHeight="8px" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
