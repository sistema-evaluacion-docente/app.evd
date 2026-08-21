import { useRef, type KeyboardEvent, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name, for when `label` isn't plain readable text (e.g. an icon). */
  ariaLabel?: string
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  /** Selected value; always one of `options`. */
  value: T
  onValueChange: (value: T) => void
  /** Accessible name of the group as a whole, e.g. "Modalidad". */
  ariaLabel: string
  /** Height of the segments. Defaults to `xs`. */
  size?: 'xs' | 'sm'
  /** Disables every segment at once. */
  disabled?: boolean
  className?: string
}

/** Next selectable option walking in `step` direction, wrapping around. */
function nextEnabledIndex<T extends string>(
  options: SegmentedControlOption<T>[],
  from: number,
  step: number,
): number | undefined {
  const total = options.length

  for (let offset = 1; offset <= total; offset++) {
    const index = (((from + step * offset) % total) + total) % total

    if (!options[index].disabled) return index
  }

  return undefined
}

/**
 * Picks one of a few mutually exclusive options, laid out as adjacent segments
 * — the compact alternative to a select when the choices are two or three and
 * worth showing at a glance. Purely presentational: it owns no state and knows
 * nothing about what the options mean.
 *
 * Exposed as an ARIA radiogroup: one tab stop, arrow keys move between segments
 * (skipping disabled ones) and select as they go.
 *
 * @example
 * <SegmentedControl
 *   ariaLabel="Modalidad"
 *   options={[
 *     { value: 'PRESENCIAL', label: 'Presencial' },
 *     { value: 'DISTANCIA', label: 'Distancia' },
 *   ]}
 *   value={modality}
 *   onValueChange={setModality}
 * />
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  ariaLabel,
  size = 'xs',
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const segmentsRef = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0

    if (step === 0 || disabled) return

    const current = options.findIndex((option) => option.value === value)
    const next = nextEnabledIndex(options, current, step)

    if (next === undefined || next === current) return

    event.preventDefault()
    onValueChange(options[next].value)
    segmentsRef.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn('bg-muted border inline-flex items-center gap-0.5 rounded-md p-0.5', className)}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value

        return (
          <Button
            key={option.value}
            ref={(node: HTMLButtonElement | null) => {
              segmentsRef.current[index] = node
            }}
            type="button"
            role="radio"
            size={size}
            variant={isSelected ? 'default' : 'ghost'}
            aria-checked={isSelected}
            aria-label={option.ariaLabel}
            // One tab stop for the whole group: arrows move within it.
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled || option.disabled}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
