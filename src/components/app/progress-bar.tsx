import { cn } from '@/lib/utils'

type Tone = 'primary' | 'accent' | 'purple' | 'info' | 'success'

const FILL: Record<Tone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  purple: 'bg-purple',
  info: 'bg-info',
  success: 'bg-success',
}

interface ProgressBarProps {
  value: number
  tone?: Tone
  className?: string
  size?: 'sm' | 'md'
}

/** Bilah kemajuan dengan lebar aman 0–100. */
export function ProgressBar({
  value,
  tone = 'primary',
  className,
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-border/60',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          FILL[tone]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
