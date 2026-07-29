'use client'

import { getColor, initials, getPct, getTotalHafal } from '@/lib/helpers'
import type { SantriWithCount } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/Card'
import { ChevronRight } from 'lucide-react'

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
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Buka detail ${student.nama}`}
      className="cursor-pointer mb-3"
    >
      <Card className="border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-surface">
        <CardContent className="p-4 flex items-center gap-4">
          {/* Avatar */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: color }}
          >
            {initials(student.nama)}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-[15px] font-semibold text-text truncate pr-2">{student.nama}</div>
              <div className="shrink-0 text-sm font-bold" style={{ color }}>{pct}%</div>
            </div>
            
            <div className="text-xs text-text-muted font-medium mb-2.5 flex items-center gap-1.5">
              <span className="bg-card px-2 py-0.5 rounded-md border border-border/50">{student.kelas || 'Tanpa kelas'}</span>
              {student.group_name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span>{student.group_name}</span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-border"></span>
              <span className="font-semibold text-text-secondary">{hafal} surah</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>

          {/* Action Icon */}
          <div className="shrink-0 pl-1 text-text-muted/50 transition-colors group-hover:text-text-muted">
            <ChevronRight className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
