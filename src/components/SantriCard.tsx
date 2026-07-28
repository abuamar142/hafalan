'use client'

import { getColor, initials, getPct, getTotalHafal } from '@/lib/helpers'
import type { SantriWithCount } from '@/lib/types'

interface SantriCardProps {
  student: SantriWithCount
  index: number
  onClick: () => void
}

export default function SantriCard({ student, index, onClick }: SantriCardProps) {
  const color = getColor(student, index)
  const pct = getPct(student)
  const hafal = getTotalHafal(student)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius)] bg-card p-3.5 text-left transition-opacity hover:opacity-85 mb-2"
    >
      {/* Avatar */}
      <div
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {initials(student.nama)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text truncate">{student.nama}</div>
        <div className="text-[11px] text-text-muted">
          {student.kelas || 'Tanpa kelas'}
          {student.usia ? ` \u00B7 ${student.usia} th` : ''} \u00B7 {hafal} surah
        </div>
        <div className="mt-1.5 h-[5px] overflow-hidden rounded-[3px] bg-border">
          <div
            className="h-full rounded-[3px] transition-all duration-400"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div
        className="shrink-0 text-[13px] font-medium"
        style={{ color }}
      >
        {pct}%
      </div>
    </button>
  )
}
