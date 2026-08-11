import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useListCourses } from '../api'

export interface CourseSelectProps {
  /** Selected course's id. */
  value?: number
  onValueChange?: (value: number | undefined) => void
  /**
   * Scopes options to one department. Defaults to the authenticated
   * director's own department (see `useListCourses`); pass `null` for every
   * department.
   */
  departmentId?: number | null
  placeholder?: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'default'
  /** Shows a trailing button to clear the selection once a course is picked. Defaults to `true`. */
  clearable?: boolean
}

/**
 * Select populated with a department's courses (`GET /courses/`), for
 * filtering other views by course.
 *
 * @example
 * <CourseSelect value={courseId} onValueChange={setCourseId} />
 */
export function CourseSelect({
  value,
  onValueChange,
  departmentId,
  placeholder = 'Asignatura',
  ariaLabel = 'Asignatura',
  className,
  disabled = false,
  size = 'default',
  clearable = true,
}: CourseSelectProps) {
  const { data, isLoading } = useListCourses({ limit: 100, departmentId })

  const courses = data?.data ?? []

  if (isLoading) {
    return <Spinner className={cn('size-5', className)} />
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={value}
        onValueChange={(val) => onValueChange?.(val as number)}
        disabled={disabled}
      >
        <SelectTrigger aria-label={ariaLabel} size={size} className={cn('w-fit', className)}>
          <SelectValue placeholder={placeholder}>
            {value != null
              ? (courses.find((course) => course.id === value)?.name ?? placeholder)
              : undefined}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">Sin asignaturas.</p>
          ) : (
            courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name || course.code}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {clearable && value != null && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onValueChange?.(undefined)}
          aria-label="Limpiar asignatura"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
