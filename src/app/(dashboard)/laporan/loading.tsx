import {
  PageHeaderSkeleton,
  CardGridSkeleton,
} from '@/components/app/skeletons'

export default function CardsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} cols={3} />
    </div>
  )
}
