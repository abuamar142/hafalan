import Image from 'next/image'
import { cn } from '@/lib/utils'
import { SCHOOL_NAME } from '@/lib/constants'

interface BrandMarkProps {
  className?: string
  size?: number
  /** Tampilkan nama sekolah di samping logo. */
  showName?: boolean
  subtitle?: string
}

/** Identitas merek (logo + nama) — dipakai di sidebar, login, dan landing. */
export function BrandMark({
  className,
  size = 40,
  showName = true,
  subtitle,
}: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/images/logo.jpg"
        alt={`Logo ${SCHOOL_NAME}`}
        width={size}
        height={size}
        className="rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
        style={{ width: size, height: size }}
        priority
      />
      {showName ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-foreground">
            {SCHOOL_NAME}
          </p>
          {subtitle ? (
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
