import { SearchSelect } from '@/components/common/SearchSelect'
import { cn } from '@/lib/utils'
import { useListCourses } from '../api'
import type { CourseRecord } from '../types'

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
  /**
   * Shows a way to clear the selection once a course is picked. Defaults to
   * `true`. The field draws it inside itself, so it costs no room in the row.
   */
  clearable?: boolean
}

/**
 * Select populated with a department's courses (`GET /courses/`), for
 * filtering other views by course.
 *
 * A combobox rather than a select, like its neighbour {@link TeacherSelect}:
 * a department runs well past the hundred options this fetches, and scrolling
 * a flat list for one of them is worse than typing three letters of it.
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
  const selected = courses.find((course) => course.id === value) ?? null

  return (
    <SearchSelect<CourseRecord>
      value={selected}
      onValueChange={(course) => onValueChange?.(course?.id)}
      items={courses}
      itemToKey={(course) => course.id}
      itemToLabel={(course) => course.name || course.code}
      filter={(course, query) => course.code.toLowerCase().includes(query.toLowerCase())}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      emptyMessage="Sin asignaturas que coincidan."
      loading={isLoading}
      loadingLabel="Cargando asignaturas…"
      disabled={disabled}
      size={size}
      clearable={clearable}
      className={cn('w-56', className)}
    />
  )
}
