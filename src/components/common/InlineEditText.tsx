import { Check, Pencil, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface InlineEditTextProps {
  /** Current text. Also the value the editor starts from every time it opens. */
  value: string
  /**
   * Called with the normalized text when the user confirms. Reject (or throw)
   * to keep the editor open — the row stays in edit mode so nothing typed is
   * lost when the request fails.
   */
  onSave: (value: string) => Promise<unknown> | void
  /** Normalizes the text before it reaches `onSave`. Defaults to trimming. */
  transform?: (value: string) => string
  /** Rendered instead of the raw text while not editing (e.g. a styled label). */
  children?: ReactNode
  placeholder?: string
  ariaLabel?: string
  /** Hides the edit affordance entirely. */
  disabled?: boolean
  className?: string
}

/**
 * Text that turns into an input in place, for fixing one field of a row
 * without leaving the list. `Enter` confirms, `Escape` cancels, and the
 * editor stays open if `onSave` rejects.
 *
 * @example
 * <InlineEditText
 *   value={course.name}
 *   ariaLabel={`Editar nombre de ${course.code}`}
 *   onSave={(name) => updateCourse({ courseId: course.id, payload: { name } })}
 * />
 */
export function InlineEditText({
  value,
  onSave,
  transform = (text) => text.trim(),
  children,
  placeholder,
  ariaLabel = 'Editar',
  disabled = false,
  className,
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const openEditor = () => {
    setDraft(value)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const nextValue = transform(draft)

    if (!nextValue || nextValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)

    try {
      await onSave(nextValue)
      setIsEditing(false)
    } catch {
      // Kept open on purpose: the axios interceptor already toasted the
      // failure, and the typed text is worth more than a tidy reset.
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div className={cn('flex min-w-0 items-center gap-1', className)}>
        <div className="min-w-0 truncate">{children ?? value}</div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={openEditor}
            aria-label={ariaLabel}
          >
            <Pencil className="text-muted-foreground size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-1', className)}>
      <Input
        autoFocus
        value={draft}
        disabled={isSaving}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void handleSave()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setIsEditing(false)
          }
        }}
        className="h-8 min-w-0 flex-1 shadow-none"
      />

      {isSaving ? (
        <Spinner className="text-muted-foreground mx-2 size-4" />
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleSave()}
            aria-label="Guardar"
          >
            <Check className="size-4 text-emerald-600" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(false)}
            aria-label="Cancelar"
          >
            <X className="text-muted-foreground size-4" aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  )
}
