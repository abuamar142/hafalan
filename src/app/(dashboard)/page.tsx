'use client'

import { useDashboard } from './layout'
import { getPct, getTotalHafal } from '@/lib/helpers'
import { computeRanking, computeDashboardStats } from '@/lib/domain/statistics'
import { Card, CardContent } from '@/components/ui/Card'
import { Users, TrendingUp, BookOpen, Trophy } from 'lucide-react'

export default function DashboardPage() {
  const { state } = useDashboard()

  const sorted = computeRanking(state.students)
  const stats = computeDashboardStats(state.students)

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-text">Dashboard</h2>
        <p className="text-sm text-text-muted">Ikhtisar hafalan dan setoran santri.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total Santri</p>
              <h3 className="text-2xl font-bold text-text">{stats.totalStudents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Rata-rata Hafal</p>
              <h3 className="text-2xl font-bold text-text">{stats.averageHafal}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple/10 text-purple">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Total Setoran</p>
              <h3 className="text-2xl font-bold text-text">{state.submissions.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="border-border/30 shadow-sm">
        <div className="p-5 border-b border-border/50 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-text">Peringkat Hafalan</h3>
        </div>
        <CardContent className="p-0">
          {/* Empty state */}
          {sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">
              Belum ada data santri
            </div>
          )}

          {/* Student list */}
          <div className="divide-y divide-border/30">
            {sorted.slice(0, 10).map((s, i) => {
              const pct = getPct(s)
              const hafal = getTotalHafal(s)

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-4 hover:bg-card/50 transition-colors"
                >
                  {/* Rank */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0 ? 'bg-accent/15 text-accent ring-1 ring-accent/30' :
                    i === 1 ? 'bg-zinc-200 text-zinc-600 ring-1 ring-zinc-300' :
                    i === 2 ? 'bg-amber-700/10 text-amber-800 ring-1 ring-amber-700/20' :
                    'bg-surface border border-border text-text-secondary'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="truncate text-[15px] font-semibold text-text">
                        {s.nama}
                        {s.kelas && (
                          <span className="ml-2 text-[13px] font-normal text-text-muted">({s.kelas})</span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 h-2 mt-2 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: pct + '%' }}
                      />
                    </div>
                  </div>

                  {/* Hafal count */}
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-primary">{hafal}</div>
                    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Surah</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
