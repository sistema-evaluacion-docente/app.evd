import type { KeyboardEvent, ReactNode } from 'react'

import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface SearchSelectProps<T> {
  /** The picked item, or `null` while nothing is chosen. */
  value: T | null
  onValueChange: (value: T | null) => void
  items: readonly T[]
  /** Identity of an item, for the React key and for matching the value back. */
  itemToKey: (item: T) => string | number
  /** What the input shows once the item is picked, and what typing matches. */
  itemToLabel: (item: T) => string
  /**
   * Narrows the list as it is typed into. Defaults to a case-insensitive match
   * on the label; pass one to search other fields too — a code, an email.
   */
  filter?: (item: T, query: string) => boolean
  /** Contents of an option, so it can carry badges, icons or a score. */
  renderItem?: (item: T) => ReactNode
  isItemDisabled?: (item: T) => boolean
  id?: string
  placeholder?: string
  /** Shown when nothing matches what was typed. */
  emptyMessage?: string
  disabled?: boolean
  /**
   * Accessible name, for a field with no visible `<Label>` of its own — the
   * filter rows above a table, where the placeholder is all there is.
   */
  ariaLabel?: string
  /** `sm` matches the compact controls of a filter row. Defaults to `default`. */
  size?: 'sm' | 'default'
  /** Offers a way to unpick the value once there is one. Defaults to `true`. */
  clearable?: boolean
  /** Paints the field as still missing, the same way an input does. */
  invalid?: boolean
  /** Id of the message saying what is missing, for `aria-describedby`. */
  describedBy?: string
  /** While the options are still on their way, the field says so out loud. */
  loading?: boolean
  loadingLabel?: string
  className?: string
}

/**
 * A select you search by typing, keyed by the item itself rather than by its
 * text — the picker for a teacher, a course, anything that has an id.
 *
 * It is the same field as {@link Combobox}, the one behind "Facultad", so both
 * read alike; what it adds is that the value is the object and that each option
 * can be decorated through `renderItem`.
 *
 * Prefer it over a `Select` with a search box inside: that popup is portalled,
 * and focusing an input inside it scrolls the page to the bottom of the body.
 *
 * @example
 * <SearchSelect
 *   value={teacher}
 *   onValueChange={setTeacher}
 *   items={candidates}
 *   itemToKey={(entry) => entry.teacher_id}
 *   itemToLabel={(entry) => entry.name ?? ''}
 *   filter={(entry, query) => entry.code?.includes(query) ?? false}
 * />
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

export function SearchSelect<T>({
  value,
  onValueChange,
  items,
  itemToKey,
  itemToLabel,
  filter,
  renderItem,
  isItemDisabled,
  id,
  placeholder,
  ariaLabel,
  size = 'default',
  clearable = true,
  emptyMessage = 'Sin coincidencias',
  disabled = false,
  invalid = false,
  describedBy,
  loading = false,
  loadingLabel = 'Cargando…',
  className,
}: SearchSelectProps<T>) {
  return (
    <Combobox<T>
      items={items as T[]}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      itemToStringLabel={itemToLabel}
      isItemEqualToValue={(item, current) => itemToKey(item) === itemToKey(current)}
      filter={(item, query) =>
        itemToLabel(item).toLowerCase().includes(query.trim().toLowerCase()) ||
        (filter?.(item, query.trim()) ?? false)
      }
      openOnInputClick
      disabled={disabled}
    >
      <ComboboxInputGroup
        className={cn(size === 'sm' && 'h-8', className)}
        aria-invalid={invalid || undefined}
      >
        {loading && (
          <Spinner className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        )}
        <ComboboxInput
          id={id}
          placeholder={loading ? loadingLabel : placeholder}
          aria-label={ariaLabel}
          aria-busy={loading || undefined}
          aria-describedby={describedBy}
          onKeyDown={keepEnterInTheList}
        />
        {clearable && value != null && !disabled && !loading && <ComboboxClear />}
        <ComboboxTrigger disabled={disabled || loading} />
      </ComboboxInputGroup>

      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>

        <ComboboxList>
          {(item: T) => (
            <ComboboxItem
              key={itemToKey(item)}
              value={item}
              disabled={isItemDisabled?.(item) ?? false}
            >
              {renderItem ? renderItem(item) : itemToLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
