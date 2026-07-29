'use client'

import { useEffect } from 'react'

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-lg)] p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red/10 text-red rounded-full flex items-center justify-center">
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
          <h2 className="text-xl font-bold text-text">Terjadi Kesalahan</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Terjadi kesalahan sistem yang tidak terduga. Silakan coba memuat ulang halaman.
          </p>
        </div>
        <div>
          <button
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-sm transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  )
}
