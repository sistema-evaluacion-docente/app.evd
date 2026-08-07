import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { CalendarIcon, ListFilter, X } from 'lucide-react'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'
import SortBy from './SortBy'

export type FilterType = 'date' | 'dateRange' | 'boolean' | 'select' | 'sort' | 'custom'

export interface FilterOption {
  label: string
  value: string | number | boolean
}

export interface SortField {
  value: string
  label: string
}

export interface SortDirection {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface DateFilterConfig {
  type: 'date'
  name: string
  label: string
  placeholder?: string
  format?: string
}

export interface DateRangeFilterConfig {
  type: 'dateRange'
  name: string
  label: string
  placeholder?: string
  format?: string
}

export interface BooleanFilterConfig {
  type: 'boolean'
  name: string
  label: string
  trueLabel?: string
  falseLabel?: string
}

export interface SelectFilterConfig {
  type: 'select'
  name: string
  label: string
  options: FilterOption[]
  placeholder?: string
  clearable?: boolean
}

export interface SortFilterConfig {
  type: 'sort'
  name: string
  label?: string
  fields: SortField[]
  directions?: SortDirection[]
  parse?: (value: string) => { field: string; direction: string }
  build?: (field: string, direction: string) => string
  /** Allow resetting the sort to no value (`''`). */
  clearable?: boolean
}

export interface CustomFilterConfig {
  type: 'custom'
  name: string
  label?: string
  render: (value: unknown, onChange: (value: unknown) => void) => React.ReactNode
}

export type FilterConfig =
  | DateFilterConfig
  | DateRangeFilterConfig
  | BooleanFilterConfig
  | SelectFilterConfig
  | SortFilterConfig
  | CustomFilterConfig

export type FilterValues = Record<string, unknown>

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DataTableFiltersProps {
  filters: FilterConfig[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  /** Label of the trigger button. Defaults to "Filtros". */
  triggerLabel?: string
  /** Label of the "clear all" action. Defaults to "Limpiar". */
  clearAllLabel?: string
  /** Extra classes for the trigger button. */
  className?: string
}

function DateFilter({
  config,
  value,
  onChange,
}: {
  config: DateFilterConfig
  value: Date | undefined
  onChange: (value: Date | undefined) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {value ? dayjs(value).format('DD/MM/YYYY') : config.placeholder || 'Seleccionar fecha'}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  )
}

function DateRangeFilter({
  config,
  value,
  onChange,
}: {
  config: DateRangeFilterConfig
  value: DateRange | undefined
  onChange: (value: DateRange | undefined) => void
}) {
  const handleSelect = (range: DayPickerDateRange | undefined) => {
    if (!range) {
      onChange(undefined)
      return
    }

    onChange({ from: range.from, to: range.to })
  }

  const formatRange = () => {
    if (!value?.from) return config.placeholder || 'Seleccionar rango'
    if (!value.to) return `${dayjs(value.from).format('DD/MM/YYYY')} - ...`

    return `${dayjs(value.from).format('DD/MM/YYYY')} - ${dayjs(value.to).format('DD/MM/YYYY')}`
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                'flex-1 w-full justify-start text-left font-normal',
                !value?.from && 'text-muted-foreground',
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {formatRange()}
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: value?.from, to: value?.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {value?.from && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(undefined)}
          aria-label="Limpiar rango"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

function BooleanFilter({
  config,
  value,
  onChange,
}: {
  config: BooleanFilterConfig
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={config.name} className="text-sm font-medium">
        {config.label}
      </Label>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs tabular-nums',
            value ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {value ? config.trueLabel || 'Sí' : config.falseLabel || 'No'}
        </span>
        <Switch id={config.name} checked={value} onCheckedChange={onChange} />
      </div>
    </div>
  )
}

function SelectFilter({
  config,
  value,
  onChange,
}: {
  config: SelectFilterConfig
  value: string | number | undefined
  onChange: (value: string | number | undefined) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value != null ? String(value) : undefined}
        onValueChange={(val) => onChange(val === '' || val == null ? undefined : val)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={config.placeholder || 'Seleccionar...'} />
        </SelectTrigger>

        <SelectContent>
          {config.options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {config.clearable && value && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(undefined)}
          aria-label="Limpiar filtro"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

function SortFilter({
  config,
  value,
  onChange,
}: {
  config: SortFilterConfig
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SortBy
      fields={config.fields}
      directions={config.directions}
      value={value}
      onChange={onChange}
      parse={config.parse}
      build={config.build}
      clearable={config.clearable}
    />
  )
}

/**
 * Popover-based filter control for `DataTable`. The trigger button shows the
 * label plus an active-filter count badge, and opens a compact panel with the
 * configured filters (dates, booleans, selects, sort, custom) stacked
 * vertically. All changes are streamed to the caller via `onChange`.
 *
 * @example
 * <DataTableFilters
 *   filters={[
 *     { type: 'boolean', name: 'active', label: 'Activo' },
 *     { type: 'select', name: 'status', label: 'Estado', options: [...] },
 *     { type: 'sort', name: 'sort', fields: [{ value: 'name', label: 'Nombre' }] },
 *   ]}
 *   values={values}
 *   onChange={(next) => setValues(next)}
 * />
 */
export function DataTableFilters({
  filters,
  values,
  onChange,
  triggerLabel = 'Filtros',
  clearAllLabel = 'Limpiar',
  className,
}: DataTableFiltersProps) {
  const handleChange = (name: string, value: unknown) => {
    onChange({ ...values, [name]: value })
  }

  const handleClearAll = () => {
    const cleared: FilterValues = {}
    filters.forEach((filter) => {
      if (filter.type === 'boolean') {
        cleared[filter.name] = false
      } else if (filter.type === 'sort') {
        cleared[filter.name] = filter.clearable
          ? ''
          : filter.fields[0]?.value
            ? `${filter.fields[0].value}_${filter.directions?.[0]?.value || 'desc'}`
            : ''
      } else {
        cleared[filter.name] = undefined
      }
    })
    onChange(cleared)
  }

  const activeCount = filters.filter((filter) => {
    const value = values[filter.name]

    if (filter.type === 'boolean') return value === true
    if (filter.type === 'sort') return false

    return value !== undefined && value !== null && value !== ''
  }).length

  const hasActive = activeCount > 0

  const sortFilters = filters.filter((filter): filter is SortFilterConfig => filter.type === 'sort')
  const popoverFilters = filters.filter((filter) => filter.type !== 'sort')

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sortFilters.map((filter) => (
        <SortFilter
          key={filter.name}
          config={filter}
          value={(values[filter.name] as string) || ''}
          onChange={(val) => handleChange(filter.name, val)}
        />
      ))}

      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                'gap-2',
                hasActive && 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10',
                className,
              )}
            />
          }
        >
          <ListFilter className="size-4" aria-hidden="true" />
          {triggerLabel}
          {hasActive && (
            <Badge variant="secondary" className="ml-0.5 min-w-5 justify-center px-1.5">
              {activeCount}
            </Badge>
          )}
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0" sideOffset={6}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ListFilter className="text-muted-foreground size-4" aria-hidden="true" />

              <span className="text-sm font-semibold">{triggerLabel}</span>

              {hasActive && (
                <Badge variant="secondary" className="min-w-5 justify-center px-1.5">
                  {activeCount}
                </Badge>
              )}
            </div>

            {hasActive && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium transition-colors"
              >
                {clearAllLabel}
              </button>
            )}
          </div>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4">
            {popoverFilters.map((filter) => {
              const value = values[filter.name]

              return (
                <div key={filter.name} className="space-y-1.5">
                  {filter.label && filter.type !== 'boolean' && (
                    <Label htmlFor={filter.name} className="text-xs font-medium">
                      {filter.label}
                    </Label>
                  )}

                  {filter.type === 'date' && (
                    <DateFilter
                      config={filter}
                      value={value as Date | undefined}
                      onChange={(val) => handleChange(filter.name, val)}
                    />
                  )}

                  {filter.type === 'dateRange' && (
                    <DateRangeFilter
                      config={filter}
                      value={value as DateRange | undefined}
                      onChange={(val) => handleChange(filter.name, val)}
                    />
                  )}

                  {filter.type === 'boolean' && (
                    <BooleanFilter
                      config={filter}
                      value={Boolean(value)}
                      onChange={(val) => handleChange(filter.name, val)}
                    />
                  )}

                  {filter.type === 'select' && (
                    <SelectFilter
                      config={filter}
                      value={value as string | number | undefined}
                      onChange={(val) => handleChange(filter.name, val)}
                    />
                  )}

                  {filter.type === 'custom' &&
                    filter.render(value, (val) => handleChange(filter.name, val))}
                </div>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
