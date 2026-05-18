import { cn } from '@/shared/lib/utils'

export interface FilterPill {
  value: string
  label: string
  count?: number
  dotColor?: string
}

export interface FilterPillsProps {
  value: string
  onChange: (value: string) => void
  options: FilterPill[]
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'h-8 px-3',
  md: 'h-9 px-3',
  lg: 'h-10 px-4',
}

/** Horizontal row of single-select pill buttons (shadcn-style segmented filter). */
export function FilterPills({
  value,
  onChange,
  options,
  size = 'sm',
}: FilterPillsProps) {
  return (
    <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full text-[12px] font-medium transition-colors',
              SIZES[size],
              active
                ? 'bg-ink-900 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 hover:border-ink-300',
            )}
          >
            {option.dotColor && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: option.dotColor }}
              />
            )}
            {option.label}
            {option.count != null && (
              <span
                className={cn(
                  'num inline-flex h-[18px] items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums',
                  active ? 'bg-white/15 text-white/95' : 'bg-ink-100 text-ink-600',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
