import { Pencil, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { CATEGORIES } from '@/lib/categoryLabel'
import { RISK_LEVELS } from '@/lib/riskLevel'
import { useUpdateComment } from '../api'
import type { TeacherComment } from '../types'

export interface CommentClassificationEditorProps {
  comment: TeacherComment
}

/**
 * Director-only popover that overrides a comment's risk level and
 * pedagogical category through `useUpdateComment` (`PATCH /comments/{id}`).
 * Options come from the fixed catalogs (`RISK_LEVELS`, `CATEGORIES`) — there's
 * no endpoint to list them, so every level/category is always offered
 * regardless of what this teacher's own comments happen to cover.
 *
 * @example
 * <CommentClassificationEditor comment={comment} />
 */
export function CommentClassificationEditor({ comment }: CommentClassificationEditorProps) {
  const [open, setOpen] = useState(false)
  const [riskLevelId, setRiskLevelId] = useState(comment.risk_level?.id)
  const [categoryId, setCategoryId] = useState(comment.pedagogical_category?.id)
  const { mutate: updateComment, isPending } = useUpdateComment()

  const hasChanges =
    riskLevelId !== comment.risk_level?.id || categoryId !== comment.pedagogical_category?.id

  function handleOpenChange(next: boolean) {
    setOpen(next)

    if (next) {
      setRiskLevelId(comment.risk_level?.id)
      setCategoryId(comment.pedagogical_category?.id)
    }
  }

  function handleSave() {
    if (riskLevelId == null || categoryId == null) return

    updateComment(
      {
        commentId: comment.id,
        payload: { risk_level: riskLevelId, pedagogical_category_id: categoryId },
      },
      {
        onSuccess: () => {
          toast.success('Clasificación actualizada')
          setOpen(false)
        },
      },
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Editar clasificación del comentario"
            className="text-muted-foreground hover:text-foreground cursor-pointer normal-case transition-colors"
          />
        }
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 normal-case">
        <p className="text-sm font-semibold">Editar clasificación</p>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nivel de riesgo</Label>

          <Select value={riskLevelId} onValueChange={(value) => setRiskLevelId(value as number)}>
            <SelectTrigger className="w-full">
              <span>
                {riskLevelId != null
                  ? RISK_LEVELS.find((level) => level.id === riskLevelId)?.name
                  : 'Selecciona un nivel'}
              </span>
            </SelectTrigger>

            <SelectContent>
              {RISK_LEVELS.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Categoría pedagógica</Label>

          <Select value={categoryId} onValueChange={(value) => setCategoryId(value as number)}>
            <SelectTrigger className="w-full">
              {categoryId != null
                ? CATEGORIES.find((category) => category.id === categoryId)?.label
                : 'Selecciona una categoría'}
            </SelectTrigger>

            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={!hasChanges || isPending}
          onClick={handleSave}
        >
          <Save />
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
