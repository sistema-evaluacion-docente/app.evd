import { Pencil, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

function sameIds(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const bSet = new Set(b)
  return a.every((id) => bSet.has(id))
}

/**
 * Director-only popover that overrides a comment's risk level and
 * pedagogical categories (one or more) through `useUpdateComment` (`PATCH
 * /comments/{id}`). Options come from the fixed catalogs (`RISK_LEVELS`,
 * `CATEGORIES`) — there's no endpoint to list them, so every level/category
 * is always offered regardless of what this teacher's own comments happen
 * to cover.
 *
 * @example
 * <CommentClassificationEditor comment={comment} />
 */
export function CommentClassificationEditor({ comment }: CommentClassificationEditorProps) {
  const [open, setOpen] = useState(false)
  const [riskLevelId, setRiskLevelId] = useState(comment.risk_level?.id)
  const [categoryIds, setCategoryIds] = useState(
    comment.pedagogical_categories.map((category) => category.id),
  )
  const { mutate: updateComment, isPending } = useUpdateComment()

  const initialCategoryIds = comment.pedagogical_categories.map((category) => category.id)
  const hasChanges =
    riskLevelId !== comment.risk_level?.id || !sameIds(categoryIds, initialCategoryIds)

  function handleOpenChange(next: boolean) {
    setOpen(next)

    if (next) {
      setRiskLevelId(comment.risk_level?.id)
      setCategoryIds(comment.pedagogical_categories.map((category) => category.id))
    }
  }

  function toggleCategory(categoryId: number, checked: boolean) {
    setCategoryIds((ids) =>
      checked ? [...ids, categoryId] : ids.filter((id) => id !== categoryId),
    )
  }

  function handleSave() {
    if (riskLevelId == null || categoryIds.length === 0) return

    updateComment(
      {
        commentId: comment.id,
        payload: { risk_level: riskLevelId, pedagogical_category_ids: categoryIds },
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
          <Label className="text-xs font-medium">Categorías pedagógicas</Label>

          <div className="space-y-1.5">
            {CATEGORIES.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm font-normal">
                <Checkbox
                  checked={categoryIds.includes(category.id)}
                  onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                />
                {category.label}
              </label>
            ))}
          </div>
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
