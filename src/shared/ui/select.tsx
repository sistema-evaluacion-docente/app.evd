import { ChevronDown } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export type SelectOption = string | { value: string; label: string }

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  placeholder?: string
  ariaLabel?: string
}

/** Native select styled to match the shadcn look. */
export function Select({
  value,
  onChange,
  options,
  className,
  placeholder,
  ariaLabel,
}: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-9 w-full cursor-pointer appearance-none rounded-md border border-ink-200 bg-card pl-3 pr-9 text-[13px] text-ink-900 transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
    </div>
  )
}
