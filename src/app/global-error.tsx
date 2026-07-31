'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html lang="id">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-[var(--radius-lg)] p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Kesalahan Fatal</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aplikasi mengalami kesalahan fatal. Silakan klik tombol di bawah untuk mencoba memuat kembali.
              </p>
            </div>
            <div>
              <Button
                onClick={() => reset()}
                className="w-full"
              >
                Muat Ulang Aplikasi
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
