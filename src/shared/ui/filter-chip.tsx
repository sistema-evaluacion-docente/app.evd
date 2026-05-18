import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export interface FilterChipProps {
  children: ReactNode
  onRemove: () => void
}

/** Removable chip used to display an active filter. */
export function FilterChip({ children, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-100 pl-2.5 pr-1.5 text-[12px] text-ink-700">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-500 hover:bg-ink-200"
        aria-label="Quitar filtro"
      >
        <X size={11} />
      </button>
    </span>
  )
}
