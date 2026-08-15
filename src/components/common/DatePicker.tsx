import { useState } from 'react'
import { es } from 'date-fns/locale'
import dayjs from 'dayjs'
import { CalendarIcon, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
// Also registers the Spanish locale dayjs formats with.
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  /** Date as `YYYY-MM-DD`; empty string or undefined means "no date". */
  value?: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  /** Shows a button to clear the date once one is picked. Defaults to `true`. */
  clearable?: boolean
  className?: string
}

/** Wire format of every date field of the API. */
const ISO = 'YYYY-MM-DD'

/**
 * Date field with the calendar in Spanish, exchanging plain `YYYY-MM-DD`
 * strings with the caller so it drops straight into the API payloads.
 *
 * @example
 * <DatePicker value={startDate} onChange={setStartDate} />
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  clearable = true,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // `YYYY-MM-DD` parses as local midnight, so formatting it back is lossless.
  const parsed = value ? dayjs(value) : null
  const selected = parsed?.isValid() ? parsed.toDate() : undefined

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !selected && 'text-muted-foreground',
                className,
              )}
            />
          }
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
          {selected ? formatDate(value, 'D [de] MMMM [de] YYYY') : placeholder}
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? dayjs(date).format(ISO) : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {clearable && selected && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Limpiar fecha"
          onClick={() => onChange('')}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
