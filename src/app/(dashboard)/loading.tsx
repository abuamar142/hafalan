import {
  PageHeaderSkeleton,
  StatGridSkeleton,
  TableSkeleton,
} from '@/components/app/skeletons'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <StatGridSkeleton count={3} />
      <TableSkeleton rows={5} />
    </div>
  )
}
