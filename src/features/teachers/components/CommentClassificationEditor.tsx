import { Pencil } from 'lucide-react'
import { useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { TeacherComment } from '../types'
import { COMMENT_ACTION_TRIGGER } from './commentActionStyles'
import { CommentClassificationForm } from './CommentClassificationForm'

export interface CommentClassificationEditorProps {
  comment: TeacherComment
}

/**
 * Director-only popover that overrides a comment's risk level and
 * pedagogical categories (one or more) through `CommentClassificationForm`.
 * The form is mounted only while the popover is open, so every opening starts
 * from the comment's current classification.
 *
 * @example
 * <CommentClassificationEditor comment={comment} />
 */
export function CommentClassificationEditor({ comment }: CommentClassificationEditorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Editar clasificación del comentario"
            className={COMMENT_ACTION_TRIGGER}
          />
        }
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 normal-case">
        <p className="text-sm font-semibold">Editar clasificación</p>

        {open && <CommentClassificationForm comment={comment} onSaved={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  )
}
