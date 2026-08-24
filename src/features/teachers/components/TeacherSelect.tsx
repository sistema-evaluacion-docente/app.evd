import { SearchSelect } from '@/components/common/SearchSelect'
import { cn } from '@/lib/utils'
import { useListTeachers } from '../api'
import type { TeacherRecord } from '../types'

export interface TeacherSelectProps {
  /** Selected teacher's name — this is what filters key off, not the id. */
  value?: string
  onValueChange?: (value: string | undefined) => void
  /**
   * Selected teacher's id instead of their name. Pass this together with
   * `onIdChange` to switch the select into id mode (e.g. filtering an
   * endpoint that takes `teacher_id`) — `value`/`onValueChange` are ignored
   * once `onIdChange` is set.
   */
  idValue?: number
  onIdChange?: (value: number | undefined) => void
  /**
   * Scopes options to one department. Defaults to the authenticated
   * director's own department (see `useListTeachers`); pass `null` for
   * every department.
   */
  departmentId?: number | null
  placeholder?: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'default'
  /**
   * Shows a way to clear the selection once a teacher is picked. Defaults to
   * `true`. The field draws it inside itself, so it costs no room in the row.
   */
  clearable?: boolean
}

/**
 * Select populated with a department's teachers (`GET /teachers/`), for
 * filtering other views by teacher — e.g. a results/subjects table.
 *
 * Built on {@link SearchSelect}, which is a combobox: the list is filtered by
 * the field itself, in a popup anchored to it. It used to be a `Select` with a
 * text input smuggled into the popup, which is the one thing Base UI's select
 * cannot do — with `alignItemWithTrigger` it measures the chosen option against
 * the trigger and sets the popup's height by hand, so every keystroke re-ran
 * that pass, and once the list no longer fit it fell back to an absolutely
 * positioned portal at the end of `<body>` and stretched the document. That is
 * what "the filter pushes the page down" was.
 *
 * @example
 * <TeacherSelect value={teacherName} onValueChange={setTeacherName} />
 *
 * @example
 * // Id mode, for endpoints filtered by teacher_id.
 * <TeacherSelect idValue={teacherId} onIdChange={setTeacherId} />
 */
export function TeacherSelect({
  value,
  onValueChange,
  idValue,
  onIdChange,
  departmentId,
  placeholder = 'Docente',
  ariaLabel = 'Docente',
  className,
  disabled = false,
  size = 'default',
  clearable = true,
}: TeacherSelectProps) {
  const { data, isLoading } = useListTeachers({ limit: 100, departmentId })

  const teachers = data?.data ?? []

  // The callers hold a scalar — an id or a name — while the field works in
  // whole teachers, so the object is resolved here rather than at every use.
  const byId = onIdChange !== undefined
  const selected =
    teachers.find((teacher) => (byId ? teacher.id === idValue : teacher.user.name === value)) ??
    null

  const handleChange = (teacher: TeacherRecord | null) => {
    if (byId) {
      onIdChange?.(teacher?.id)
      return
    }

    onValueChange?.(teacher?.user.name)
  }

  return (
    <SearchSelect<TeacherRecord>
      value={selected}
      onValueChange={handleChange}
      items={teachers}
      itemToKey={(teacher) => teacher.id}
      itemToLabel={(teacher) => teacher.user.name}
      filter={(teacher, query) =>
        teacher.institutional_code?.toLowerCase().includes(query.toLowerCase()) ?? false
      }
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      emptyMessage="Sin docentes que coincidan."
      // The field stays mounted while the list is on its way. Swapping it for a
      // bare spinner used to reflow the whole filter row once teachers landed.
      loading={isLoading}
      loadingLabel="Cargando docentes…"
      disabled={disabled}
      size={size}
      clearable={clearable}
      // A width by default: the field is `w-full` underneath, which inside the
      // flex filter rows it lives in would claim the whole line. Callers that
      // do fill a column (the filters popover) override it.
      className={cn('w-56', className)}
    />
  )
}
