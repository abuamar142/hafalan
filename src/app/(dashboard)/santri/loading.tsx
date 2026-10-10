import {
  PageHeaderSkeleton,
  TableSkeleton,
} from '@/components/app/skeletons'

export default function ListLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  )
}
