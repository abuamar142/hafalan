'use client'

import { useDashboard } from '../layout'
import { getPct } from '@/lib/helpers'
import { computeRanking, computeDashboardStats } from '@/lib/domain/statistics'
import { StatCard } from '@/components/app/stat-card'
import { SectionCard } from '@/components/app/section-card'
import { EmptyState } from '@/components/app/empty-state'
import { ProgressBar } from '@/components/app/progress-bar'
import { PageHeader } from '@/components/app/page-header'
import { TARGET_JUZ } from '@/lib/constants'
import { Users, TrendingUp, BookOpen, Trophy, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { state } = useDashboard()

  const sorted = computeRanking(state.students)
  const stats = computeDashboardStats(state.students)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ikhtisar capaian hafalan dan setoran santri."
        icon={<TrendingUp />}
      />

      {/* Metrik utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Santri"
          value={stats.totalStudents}
          icon={<Users />}
          tone="primary"
        />
        <StatCard
          label="Rata-rata Hafal"
          value={`${stats.averageJuz} Juz`}
          icon={<TrendingUp />}
          tone="accent"
          hint={`Target ${TARGET_JUZ} Juz`}
        />
        <StatCard
          label="Total Setoran"
          value={state.submissions.length}
          icon={<BookOpen />}
          tone="purple"
        />
      </div>

      {/* Peringkat hafalan */}
      <SectionCard
        title="Peringkat Hafalan"
        icon={<Trophy />}
        flush
        action={
          <span className="text-xs font-medium text-muted-foreground">
            {sorted.length} santri
          </span>
        }
      >
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Belum ada data santri"
            description="Tambahkan santri terlebih dahulu melalui menu Manajemen → Siswa."
            className="border-0 bg-transparent"
          />
        ) : (
          <ol className="divide-y divide-border/50">
            {sorted.slice(0, 10).map((s, i) => {
              const pct = getPct(s)
              const juzDone = s.juz_selesai || 0
              const isTop3 = i < 3
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  {/* Peringkat */}
                  <span
                    className={cn(
                      'tabular flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      i === 0 &&
                        'bg-accent/15 text-accent ring-1 ring-accent/30',
                      i === 1 && 'bg-muted text-foreground ring-1 ring-border',
                      i === 2 &&
                        'bg-amber-600/10 text-amber-700 ring-1 ring-amber-600/25 dark:text-amber-500',
                      !isTop3 && 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    {isTop3 ? (
                      <Medal className="size-4" />
                    ) : (
                      i + 1
                    )}
                  </span>

                  {/* Info + progres */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[15px] font-semibold text-foreground">
                        {s.nama}
                      </span>
                      {s.kelas ? (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {s.kelas}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar
                        value={pct}
                        size="sm"
                        tone={i === 0 ? 'accent' : 'primary'}
                      />
                      <span className="tabular w-9 shrink-0 text-right text-[11px] font-bold text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Jumlah juz */}
                  <div className="shrink-0 text-right">
                    <div className="tabular text-base font-bold text-primary">
                      {juzDone}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Juz
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </SectionCard>
    </div>
  )
}
