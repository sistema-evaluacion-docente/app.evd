import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo } from 'react'

const RANGE_OPTIONS = [2, 3, 5] as const

export type RangeValue = '2' | '3' | '5' | 'all'

export interface RangeSelectProps {
  totalItems: number
  value: RangeValue
  onChange: (value: RangeValue) => void
  className?: string
}

export function RangeSelect({ totalItems, value, onChange, className }: RangeSelectProps) {
  const items = useMemo(() => {
    const list: { value: RangeValue; label: string }[] = RANGE_OPTIONS.filter(
      (count) => totalItems > count,
    ).map((count) => ({
      value: String(count) as RangeValue,
      label: `Ultimos ${count} semestres`,
    }))
    list.push({ value: 'all', label: 'Todos los semestres' })
    return list
  }, [totalItems])

  if (items.length <= 1) return null

  return (
    <div className={className}>
      <Select
        items={items}
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v as RangeValue)
        }}
      >
        <SelectTrigger aria-label="Rango de comparacion" className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent alignItemWithTrigger={false}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
