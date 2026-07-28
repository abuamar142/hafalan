'use client'

import { useDashboard } from '../layout'
import { getPct, getTotalHafal } from '@/lib/helpers'
import { ALL_SURAHS } from '@/lib/constants'

export default function RekapPage() {
  const { state } = useDashboard()

  const sorted = [...state.students].sort(
    (a, b) => getPct(b) - getPct(a)
  )

  const totalHafal = state.students.reduce(
    (sum, s) => sum + getTotalHafal(s),
    0
  )

  const avgHafal =
    state.students.length > 0
      ? Math.round(totalHafal / state.students.length)
      : 0

  return (
    <>
      {/* Stats Row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card p-3 border border-border text-center">
          <div className="text-xl font-bold text-text">{state.students.length}</div>
          <div className="mt-0.5 text-[11px] text-text-secondary">Total Santri</div>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border text-center">
          <div className="text-xl font-bold text-text">{avgHafal}</div>
          <div className="mt-0.5 text-[11px] text-text-secondary">Rata-rata Hafal</div>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border text-center">
          <div className="text-xl font-bold text-text">{state.submissions.length}</div>
          <div className="mt-0.5 text-[11px] text-text-secondary">Total Setoran</div>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="py-7 text-center text-[13px] text-text-muted">
          Belum ada santri
        </div>
      )}

      {/* Student list */}
      {sorted.map((s, i) => {
        const pct = getPct(s)
        const hafal = getTotalHafal(s)

        return (
          <div
            key={s.id}
            className="flex items-center gap-3 py-2.5 border-b border-border/50"
          >
            {/* Rank */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
              {i + 1}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate text-sm font-medium text-text">
                  {s.nama}
                  {s.kelas && (
                    <span className="ml-1.5 text-text-muted">({s.kelas})</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-2 mt-2 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: pct + '%' }}
                />
              </div>
            </div>

            {/* Hafal count */}
            <div className="shrink-0 text-[13px] font-medium text-primary">
              {hafal} hafal
            </div>
          </div>
        )
      })}
    </>
  )
}
