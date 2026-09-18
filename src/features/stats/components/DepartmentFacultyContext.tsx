import type { ReactNode } from 'react'

import { useGetDepartments, useGetDepartmentUploads } from '@/features/departments'
import useAuth from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useGetFacultyAverages } from '../api'

export interface DepartmentFacultyContextProps {
  departmentId: number
  /** Academic period the context is read for. */
  periodId: number
  className?: string
}

/**
 * Puts a department's period in the context of its faculty: its position in
 * the faculty's ranking, how far it sits from the faculty average, and how
 * many of the faculty's departments already uploaded evaluations. Built from
 * `GET /departments/`, `GET /stats/departments/uploads` and
 * `GET /stats/faculties/{id}/average` — aggregates only, no teacher or
 * comment data. Renders nothing until the department is scored in the period.
 *
 * @example
 * <DepartmentFacultyContext departmentId={4} periodId={12} />
 */
export function DepartmentFacultyContext({
  departmentId,
  periodId,
  className,
}: DepartmentFacultyContextProps) {
  const { selectedRole } = useAuth()
  const { data: departmentsData } = useGetDepartments({ limit: 100 })
  const departments = departmentsData?.data ?? []
  const facultyId = departments.find((department) => department.id === departmentId)?.faculty_id

  const { data: uploadsData } = useGetDepartmentUploads(periodId)
  const { data: facultyAveragesData } = useGetFacultyAverages(facultyId)

  if (facultyId == null) return null

  const peerIds = new Set(
    departments.filter((department) => department.faculty_id === facultyId).map((d) => d.id),
  )
  const peers = (uploadsData?.data ?? []).filter((row) => peerIds.has(row.department_id))
  const own = peers.find((row) => row.department_id === departmentId)

  const ranked = peers
    .filter((row) => row.global_average != null)
    .sort((a, b) => (b.global_average as number) - (a.global_average as number))
  const position = ranked.findIndex((row) => row.department_id === departmentId) + 1

  const facultyAverage = facultyAveragesData?.data?.find(
    (row) => row.academic_period_id === periodId,
  )?.global_average
  const gap =
    own?.global_average != null && facultyAverage != null
      ? own.global_average - facultyAverage
      : undefined

  const uploadedCount = peers.filter((row) => row.has_uploaded).length

  if (peers.length === 0) return null

  // The VICERRECTOR ACADEMICO sees every faculty side by side elsewhere, so
  // measuring one department against its faculty's average tells them nothing.
  const showFacultyGap = selectedRole !== 'VICERRECTOR ACADEMICO'
  // The DECANO already sees their departments ranked on their home, so a
  // position here only repeats it; it stays for the VICERRECTOR.
  const showPosition = selectedRole !== 'DECANO'

  return (
    <section
      className={cn(
        'border-border bg-background divide-border grid grid-cols-1 divide-y overflow-hidden rounded-md border sm:divide-x sm:divide-y-0',
        'sm:grid-cols-2',
        className,
      )}
    >
      {showPosition && (
        <Fact label="Posición en su facultad">
          {position > 0 ? (
            <span className="text-2xl font-semibold tabular-nums">
              {position}
              <span className="text-muted-foreground text-base font-normal">
                {' '}
                de {ranked.length}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">Sin promedio en este periodo</span>
          )}
        </Fact>
      )}

      {showFacultyGap && (
        <Fact label="Frente al promedio de la facultad">
          {gap != null && facultyAverage != null ? (
            <>
              <span
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  gap >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {gap >= 0 ? '+' : ''}
                {gap.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-xs">
                La facultad promedia {facultyAverage.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Sin datos para comparar</span>
          )}
        </Fact>
      )}

      <Fact label="Departamentos que subieron">
        <span className="text-2xl font-semibold tabular-nums">
          {uploadedCount}
          <span className="text-muted-foreground text-base font-normal"> / {peers.length}</span>
        </span>
        <span className="text-muted-foreground text-xs">en la facultad, este periodo</span>
      </Fact>
    </section>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      {children}
    </div>
  )
}
