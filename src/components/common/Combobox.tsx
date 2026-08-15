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
export function Combobox({
  value,
  onValueChange,
  options,
  id,
  placeholder,
  emptyMessage = 'Sin coincidencias · se guardará lo que escribas',
  disabled = false,
  className,
}: ComboboxProps) {
  return (
    <Autocomplete
      items={options as string[]}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      openOnInputClick
    >
      <AutocompleteInputGroup className={cn(className)}>
        <AutocompleteInput id={id} placeholder={placeholder} disabled={disabled} />
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
