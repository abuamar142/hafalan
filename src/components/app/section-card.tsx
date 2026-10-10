import * as React from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  /** Hilangkan padding konten (mis. untuk tabel yang mengisi penuh). */
  flush?: boolean
}

/** Kartu bagian dengan header seragam (judul + ikon + slot aksi). */
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  contentClassName,
  flush = false,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft',
        className
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
                {icon}
              </span>
            ) : null}
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn(flush ? '' : 'p-5', contentClassName)}>{children}</div>
    </section>
  )
}
