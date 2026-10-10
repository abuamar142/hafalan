import * as React from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'error' | 'success' | 'info'

const STYLES: Record<Variant, string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-info/30 bg-info/10 text-info',
}

const ICONS: Record<Variant, React.ComponentType<{ className?: string }>> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

/** Kotak pesan sebaris untuk error / sukses / info. */
export function Alert({
  variant = 'error',
  title,
  children,
  className,
}: {
  variant?: Variant
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const Icon = ICONS[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium',
        STYLES[variant],
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-bold">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}
