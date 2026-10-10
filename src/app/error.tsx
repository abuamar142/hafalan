'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-soft-lg">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Terjadi kesalahan sistem yang tidak terduga. Silakan coba memuat
            ulang halaman.
          </p>
        </div>
        <Button onClick={() => reset()} className="w-full gap-2">
          <RotateCcw className="size-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
