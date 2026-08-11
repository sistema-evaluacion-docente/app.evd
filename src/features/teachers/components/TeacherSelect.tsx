import { X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useListTeachers } from '../api'

export interface TeacherSelectProps {
  /** Selected teacher's name — this is what filters key off, not the id. */
  value?: string
  onValueChange?: (value: string | undefined) => void
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
  /** Shows a trailing button to clear the selection once a teacher is picked. Defaults to `true`. */
  clearable?: boolean
}

/**
 * Select populated with a department's teachers (`GET /teachers/`), for
 * filtering other views by teacher — e.g. a results/subjects table.
 *
 * @example
 * <TeacherSelect value={teacherName} onValueChange={setTeacherName} />
 */
export function TeacherSelect({
  value,
  onValueChange,
  departmentId,
  placeholder = 'Docente',
  ariaLabel = 'Docente',
  className,
  disabled = false,
  size = 'default',
  clearable = true,
}: TeacherSelectProps) {
  const [query, setQuery] = useState('')
  const { data, isLoading } = useListTeachers({ limit: 100, departmentId })
  const teachers = data?.data ?? []
  const filteredTeachers = query
    ? teachers.filter((teacher) => teacher.user.name.toLowerCase().includes(query.toLowerCase()))
    : teachers

  if (isLoading) {
    return <Spinner className={cn('size-5', className)} />
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={value}
        onValueChange={(val) => onValueChange?.(val as string)}
        onOpenChange={(open) => {
          if (!open) setQuery('')
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-label={ariaLabel} size={size} className={cn('w-fit', className)}>
          <SelectValue placeholder={placeholder}>{value}</SelectValue>
        </SelectTrigger>

        <SelectContent className="w-72">
          <div className="p-1">
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Buscar docente..."
              aria-label="Buscar docente"
              className="h-8"
              autoFocus
            />
          </div>

          {filteredTeachers.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">Sin resultados.</p>
          ) : (
            filteredTeachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.user.name}>
                {teacher.user.name}
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
          aria-label="Limpiar docente"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
