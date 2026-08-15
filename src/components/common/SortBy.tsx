import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  ArrowDownIcon,
  ArrowDownUp,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  RotateCcw,
} from 'lucide-react'
import { useState } from 'react'

export interface SortByField {
  value: string
  label: string
}

export interface SortByDirection {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_DIRECTIONS: SortByDirection[] = [
  { value: 'desc', label: 'Desc', icon: ArrowDownIcon },
  { value: 'asc', label: 'Asc', icon: ArrowUpIcon },
]

function defaultParse(value: string): { field: string; direction: string } {
  const parts = value.split('_')
  const direction = parts.pop() as string
  const field = parts.join('_')
  return { field, direction }
}

function defaultBuild(field: string, direction: string): string {
  return `${field}_${direction}`
}

interface SortByProps {
  fields: SortByField[]
  directions?: SortByDirection[]
  value: string
  onChange: (value: string) => void
  parse?: (value: string) => { field: string; direction: string }
  build?: (field: string, direction: string) => string
  label?: string
  /** Renders a "clear" action that resets the value to `''`. */
  clearable?: boolean
  className?: string
}

/**
 * A component for selecting a sort field and direction.
 *
 * @param {SortByProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered SortBy component.
 */
function SortBy({
  fields,
  directions = DEFAULT_DIRECTIONS,
  value,
  onChange,
  parse = defaultParse,
  build = defaultBuild,
  label = 'Ordenar por',
  clearable = false,
  className,
}: SortByProps) {
  const [open, setOpen] = useState(false)

  const current = value ? parse(value) : { field: '', direction: '' }
  const currentField = current.field
  const currentDirection = current.direction
  const [pendingField, setPendingField] = useState(currentField)
  const [pendingDirection, setPendingDirection] = useState(currentDirection)

  const currentFieldLabel = fields.find((f) => f.value === currentField)?.label ?? currentField

  function handleOpen(nextOpen: boolean) {
    if (!nextOpen && (pendingField !== currentField || pendingDirection !== currentDirection)) {
      onChange(pendingField ? build(pendingField, pendingDirection) : '')
    }

    if (nextOpen) {
      setPendingField(currentField)
      setPendingDirection(currentDirection)
    }

    setOpen(nextOpen)
  }

  function handleClear() {
    onChange('')
    setOpen(false)
  }

  function handleApply() {
    onChange(pendingField ? build(pendingField, pendingDirection) : '')
    setOpen(false)
  }

  return (
    <div className={cn('flex items-center gap-2', className)} title={label}>
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger render={<Button variant="outline" className="h-9 gap-2" />}>
          <ArrowDownUp className="size-4" />
          <span className="text-sm font-medium">{currentFieldLabel || 'Ordenar por'}</span>
          <ChevronDownIcon className="text-muted-foreground size-4" />
        </PopoverTrigger>

        <PopoverContent className="w-56 p-0" sideOffset={4}>
          <div className="flex flex-col">
            <div className="flex flex-col p-1">
              {fields.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPendingField(item.value)}
                  className={`hover:bg-muted flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${pendingField === item.value ? 'text-primary font-medium' : 'text-foreground'}`}
                >
                  <span>{item.label}</span>

                  {pendingField === item.value && <CheckIcon className="text-primary size-4" />}
                </button>
              ))}
            </div>

            <div className="bg-border mx-2 h-px" />

            <div className="flex flex-col p-1">
              {directions.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPendingDirection(item.value)}
                    className={`hover:bg-muted flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${pendingDirection === item.value ? 'text-primary font-medium' : 'text-foreground'}`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {pendingDirection === item.value && (
                      <CheckIcon className="text-primary ml-auto size-4" />
                    )}
                  </button>
                )
              })}
            </div>

            {clearable && (
              <>
                <div className="bg-border mx-2 h-px" />

                <div className="flex p-1">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors"
                  >
                    <RotateCcw className="size-4" />
                    <span>Sin orden</span>
                  </button>
                </div>
              </>
            )}

            <div className="bg-border mx-2 h-px" />

            <div className="p-1">
              <Button type="button" size="sm" className="w-full" onClick={handleApply}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default SortBy
