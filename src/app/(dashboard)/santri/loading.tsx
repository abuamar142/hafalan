import { Card, CardContent } from '@/components/ui/Card'

export default function SantriLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-28 rounded-md bg-border/60" />
          <div className="h-4 w-48 rounded-md bg-border/40" />
        </div>
        <div className="h-10 w-36 rounded-md bg-border/50 shrink-0" />
      </div>

      {/* Search Input Skeleton */}
      <div className="h-9 w-64 rounded-md bg-border/40" />

      {/* Table Skeleton */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-surface">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/50 bg-card/50">
                  <th className="py-3.5 px-4 w-16"><div className="h-4 w-8 rounded bg-border/60 mx-auto" /></th>
                  <th className="py-3.5 px-4"><div className="h-4 w-28 rounded bg-border/60" /></th>
                  <th className="py-3.5 px-4"><div className="h-4 w-24 rounded bg-border/60" /></th>
                  <th className="py-3.5 px-4"><div className="h-4 w-16 rounded bg-border/60" /></th>
                  <th className="py-3.5 px-4 text-center"><div className="h-4 w-20 rounded bg-border/60 mx-auto" /></th>
                  <th className="py-3.5 px-4 w-44 text-center"><div className="h-4 w-16 rounded bg-border/60 mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <tr key={i} className="hover:bg-card/30">
                    <td className="py-3.5 px-4"><div className="h-4 w-4 rounded bg-border/40 mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 rounded bg-border/55" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 rounded bg-border/40" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 rounded bg-border/40" /></td>
                    <td className="py-3.5 px-4">
                      <div className="max-w-[120px] mx-auto space-y-1.5">
                        <div className="h-2 w-full rounded bg-border/40" />
                        <div className="h-3 w-8 rounded bg-border/50 mx-auto" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-16 rounded bg-border/50" />
                        <div className="h-8 w-16 rounded bg-border/50" />
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
