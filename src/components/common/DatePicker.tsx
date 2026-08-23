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
  /** Paints the field as still missing, the same way an input does. */
  invalid?: boolean
  /** Leaving it without a date is what turns it red the first time. */
  onBlur?: () => void
  /** Id of the message saying what is missing, for `aria-describedby`. */
  describedBy?: string
  /** Earliest date that can be picked, as `YYYY-MM-DD`. */
  minDate?: string
  /** Latest date that can be picked, as `YYYY-MM-DD`. */
  maxDate?: string
  /** Shows a button to clear the date once one is picked. Defaults to `true`. */
  clearable?: boolean
  /** Sizes the field: it lands on the wrapper, which the trigger fills. */
  className?: string
}

/** Wire format of every date field of the API. */
const ISO = 'YYYY-MM-DD'

/** `YYYY-MM-DD` parses as local midnight, so formatting it back is lossless. */
function toDate(value?: string): Date | undefined {
  const parsed = value ? dayjs(value) : null

  return parsed?.isValid() ? parsed.toDate() : undefined
}

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
  invalid = false,
  onBlur,
  describedBy,
  minDate,
  maxDate,
  clearable = true,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = toDate(value)
  const min = toDate(minDate)
  const max = toDate(maxDate)

  // Days outside the allowed range are greyed out instead of hidden, so the
  // limit is visible rather than a calendar that silently ignores clicks.
  const outOfRange = [...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])]

  const canClear = clearable && Boolean(selected) && !disabled

  // The clear button rides on top of the trigger instead of beside it: as a
  // sibling it stuck out of the field and ran into whatever came next (the save
  // button of an inline form). It can't be nested — the trigger is a button —
  // so it is layered over the trigger's own right padding.
  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              onBlur={onBlur}
              className={cn(
                'w-full justify-start text-left font-normal',
                !selected && 'text-muted-foreground',
                canClear && 'pr-8',
              )}
            />
          }
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {selected ? formatDate(value, 'D [de] MMMM [de] YYYY') : placeholder}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected ?? min ?? max}
            disabled={outOfRange.length > 0 ? outOfRange : undefined}
            startMonth={min}
            endMonth={max}
            onSelect={(date) => {
              onChange(date ? dayjs(date).format(ISO) : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {canClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Limpiar fecha"
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-1 my-auto"
          onClick={() => onChange('')}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
