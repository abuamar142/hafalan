'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  function getPageNumbers(): (number | 'ellipsis')[] {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)

    if (currentPage > 3) pages.push('ellipsis')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) pages.push('ellipsis')

    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-sm font-medium text-text-secondary hover:bg-card hover:text-text disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="flex items-center justify-center w-9 h-9 text-sm text-text-muted select-none"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'border-border bg-surface text-text-secondary hover:bg-card hover:text-text'
            }`}
            aria-label={`Halaman ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-sm font-medium text-text-secondary hover:bg-card hover:text-text disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Halaman selanjutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
