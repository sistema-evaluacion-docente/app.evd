import type { KeyboardEvent } from 'react'

import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteInputGroup,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteTrigger,
} from '@/components/ui/autocomplete'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  /** The text itself is the value: anything typed counts, listed or not. */
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  id?: string
  placeholder?: string
  /** Shown when nothing matches what was typed. */
  emptyMessage?: string
  disabled?: boolean
  /** Paints the field as still missing, the same way an input does. */
  invalid?: boolean
  /** Leaving it empty is what turns it red the first time. */
  onBlur?: () => void
  /** Id of the message saying what is missing, for `aria-describedby`. */
  describedBy?: string
  className?: string
}

/**
 * Text field with suggestions: it behaves like a select when the value is in
 * the catalogue and like a plain input when it isn't, so a director can record
 * a faculty or a program the app doesn't know about yet.
 *
 * @example
 * <Combobox value={faculty} onValueChange={setFaculty} options={UFPS_FACULTY_NAMES} />
 */
/**
 * Enter inside a suggestion list belongs to the list, not to the form around
 * it: it commits the highlighted option. Without this the field also triggers
 * the form's implicit submission, so picking a faculty would try to save the
 * plan behind it. `preventDefault` only cancels that browser default — the
 * component's own selection handler still runs.
 */
function keepEnterInTheList(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') event.preventDefault()
}

export function Combobox({
  value,
  onValueChange,
  options,
  id,
  placeholder,
  emptyMessage = 'Sin coincidencias · se guardará lo que escribas',
  disabled = false,
  invalid = false,
  onBlur,
  describedBy,
  className,
}: ComboboxProps) {
  return (
    <Autocomplete
      items={options as string[]}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      openOnInputClick
    >
      <AutocompleteInputGroup className={cn(className)} aria-invalid={invalid || undefined}>
        <AutocompleteInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={onBlur}
          onKeyDown={keepEnterInTheList}
          aria-describedby={describedBy}
        />
        {value && !disabled && <AutocompleteClear />}
        <AutocompleteTrigger disabled={disabled} />
      </AutocompleteInputGroup>

      <AutocompleteContent>
        <AutocompleteEmpty>{emptyMessage}</AutocompleteEmpty>

        <AutocompleteList>
          {(option: string) => (
            <AutocompleteItem key={option} value={option}>
              {option}
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  )
}
