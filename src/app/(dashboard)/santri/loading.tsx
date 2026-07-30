import { SkeletonLine } from '@cloudflare/kumo'
import { Card, CardContent } from '@/components/ui/Card'

export default function SantriLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <SkeletonLine maxWidth={120} blockHeight="32px" />
          <SkeletonLine maxWidth={200} blockHeight="16px" />
        </div>
        <SkeletonLine maxWidth={150} blockHeight="40px" className="shrink-0" />
      </div>

      {/* Search Input Skeleton */}
      <SkeletonLine maxWidth={260} blockHeight="36px" />

      {/* Table Skeleton */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-surface">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/50 bg-card/50">
                  <th className="py-3.5 px-4 w-16"><SkeletonLine maxWidth={32} blockHeight="16px" className="mx-auto" /></th>
                  <th className="py-3.5 px-4"><SkeletonLine maxWidth={120} blockHeight="16px" /></th>
                  <th className="py-3.5 px-4"><SkeletonLine maxWidth={100} blockHeight="16px" /></th>
                  <th className="py-3.5 px-4"><SkeletonLine maxWidth={70} blockHeight="16px" /></th>
                  <th className="py-3.5 px-4 text-center"><SkeletonLine maxWidth={90} blockHeight="16px" className="mx-auto" /></th>
                  <th className="py-3.5 px-4 w-44 text-center"><SkeletonLine maxWidth={70} blockHeight="16px" className="mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <tr key={i}>
                    <td className="py-3.5 px-4"><SkeletonLine maxWidth={20} blockHeight="16px" className="mx-auto" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine minWidth={100} maxWidth={180} blockHeight="16px" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine minWidth={80} maxWidth={150} blockHeight="16px" /></td>
                    <td className="py-3.5 px-4"><SkeletonLine minWidth={60} maxWidth={100} blockHeight="16px" /></td>
                    <td className="py-3.5 px-4">
                      <div className="max-w-[120px] mx-auto space-y-1.5">
                        <SkeletonLine blockHeight="8px" />
                        <SkeletonLine maxWidth={40} blockHeight="12px" className="mx-auto" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <SkeletonLine maxWidth={70} blockHeight="32px" />
                        <SkeletonLine maxWidth={70} blockHeight="32px" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
