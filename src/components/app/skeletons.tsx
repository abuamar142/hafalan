import { cn } from '@/lib/utils'

/** Blok dasar skeleton dengan denyut halus. */
export function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border/50', className)} />
}

/** Kerangka judul halaman (ikon + judul + deskripsi + aksi). */
export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Sk className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Sk className="h-7 w-44" />
          <Sk className="h-4 w-64" />
        </div>
      </div>
      {withAction ? <Sk className="h-9 w-32 rounded-lg" /> : null}
    </div>
  )
}

/** Kerangka baris kartu metrik. */
export function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5"
        >
          <Sk className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Sk className="h-3.5 w-24" />
            <Sk className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Kerangka tabel dengan header + N baris. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center gap-4 border-b border-border/60 bg-muted/40 px-5 py-3.5">
        <Sk className="h-3.5 w-10" />
        <Sk className="h-3.5 flex-1" />
        <Sk className="hidden h-3.5 w-28 sm:block" />
        <Sk className="hidden h-3.5 w-24 sm:block" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Sk className="size-8 shrink-0 rounded-full" />
            <Sk className="h-4 flex-1" />
            <Sk className="hidden h-6 w-24 rounded-full sm:block" />
            <Sk className="hidden h-6 w-20 rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Kerangka daftar kartu (grid). */
export function CardGridSkeleton({
  count = 6,
  cols = 3,
}: {
  count?: number
  cols?: 2 | 3 | 4
}) {
  const grid =
    cols === 2
      ? 'sm:grid-cols-2'
      : cols === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <div className={cn('grid grid-cols-1 gap-4', grid)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border/70 bg-card p-5"
        >
          <Sk className="h-5 w-32" />
          <Sk className="h-3.5 w-full" />
          <Sk className="h-3.5 w-2/3" />
        </div>
      ))}
    </div>
  )
}
