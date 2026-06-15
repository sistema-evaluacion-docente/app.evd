import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

/**
 * Thin wrapper around the shadcn (Base UI) Select with a simple
 * `value`/`onChange`/`options` API. Renders a fully styled popup instead of the
 * browser's native dropdown.
 */
export function Select({
  value,
  onChange,
  options,
  className,
  placeholder,
  ariaLabel,
}: SelectProps) {
  const items = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  )

  return (
    <SelectRoot
      items={items}
      value={value}
      onValueChange={(next) => onChange((next as string) ?? '')}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}
