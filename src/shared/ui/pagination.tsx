import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  /** Left-aligned summary text, e.g. "Showing 1–10 of 24". */
  summary?: ReactNode
}

/** Numbered pagination with prev/next controls (rounded-square buttons). */
export function Pagination({ page, totalPages, onChange, summary }: PaginationProps) {
  const pages = useMemo(() => {
    const max = Math.min(totalPages, 5)
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + max - 1)
    start = Math.max(1, end - max + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-6 py-4 sm:flex-row">
      <div className="text-[12.5px] text-ink-500">{summary}</div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-card text-ink-700 hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-current={value === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md text-[13px] font-semibold transition-colors',
              value === page
                ? 'border border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300'
                : 'border border-ink-200 bg-card text-ink-700 hover:bg-ink-50',
            )}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-card text-ink-700 hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
