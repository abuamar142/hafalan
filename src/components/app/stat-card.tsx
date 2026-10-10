import * as React from 'react'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'accent' | 'purple' | 'info' | 'success' | 'warning'

const TONE: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary ring-primary/15',
  accent: 'bg-accent/10 text-accent ring-accent/15',
  purple: 'bg-purple/10 text-purple ring-purple/15',
  info: 'bg-info/10 text-info ring-info/15',
  success: 'bg-success/10 text-success ring-success/15',
  warning: 'bg-warning/10 text-warning ring-warning/15',
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  hint?: React.ReactNode
  tone?: Tone
  className?: string
}

/** Kartu metrik ringkas — dipakai di dashboard & halaman lain. */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'primary',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-200 hover:shadow-card',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon ? (
          <span
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl ring-1 [&_svg]:size-6',
              TONE[tone]
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          <p className="tabular mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
