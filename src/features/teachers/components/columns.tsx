import type { ColumnDef } from '@tanstack/react-table'

import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TeacherRecord } from '../types'

/**
 * Builds the column set for the teachers table (name, institutional code,
 * optional department, contract type, average, active) used by the shared
 * `DataTable`. Kept as a builder — rather than a static array — so callers
 * that span multiple departments (e.g. an admin-facing view) can opt into
 * the department column.
 *
 * @example
 * <DataTable columns={buildTeacherColumns({ showDepartment: true })} data={data} pageCount={pageCount} {...stateProps} />
 */
export function buildTeacherColumns({
  showDepartment = false,
}: { showDepartment?: boolean } = {}): ColumnDef<TeacherRecord>[] {
  const columns: ColumnDef<TeacherRecord>[] = [
    {
      accessorKey: 'user.name',
      id: 'name',
      header: 'Docente',
      cell: ({ row }) => {
        const teacher = row.original

        return (
          <div className="flex items-center gap-3">
            <Avatar className="border-border/70 size-9 border">
              <AvatarImage src={teacher.user.avatar_url} alt={teacher.user.name} />
              <AvatarFallback>
                <span className="text-xs font-semibold">
                  {teacher.user.name.slice(0, 2).toUpperCase()}
                </span>
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-foreground text-[15px] leading-tight font-semibold">
                {teacher.user.name}
              </span>
              <span className="text-muted-foreground text-xs leading-tight">
                {teacher.user.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'institutional_code',
      header: 'Código',
      cell: ({ getValue }) => {
        const code = getValue<string>()

        return <span className="text-muted-foreground text-sm tabular-nums">{code || '—'}</span>
      },
    },
  ]

  if (showDepartment) {
    columns.push({
      accessorKey: 'user.department_name',
      id: 'department',
      header: 'Departamento',
      cell: ({ getValue }) => {
        const departmentName = getValue<string | undefined>()

        return <span className="text-muted-foreground text-sm">{departmentName || '—'}</span>
      },
    })
  }

  columns.push(
    {
      accessorKey: 'contract_type',
      header: 'Tipo de contrato',
      cell: ({ getValue }) => {
        const type = getValue<string>()

        return <span className="text-muted-foreground text-sm">{type || '—'}</span>
      },
    },
    {
      accessorKey: 'overall_average',
      header: 'Promedio',
      cell: ({ getValue }) => {
        const average = getValue<number>()

        return <ScoreBadge value={average} decimals={2} />
      },
    },
    {
      accessorKey: 'high_risk_comments_count',
      header: 'Comentarios de alto riesgo',
      cell: ({ getValue }) => {
        const count = getValue<number | undefined>()

        return (
          <div className="text-center">
            <span className="text-muted-foreground text-sm tabular-nums">{count ?? '—'}</span>
          </div>
        )
      },
    },
    // {
    //   accessorKey: 'active',
    //   header: 'Estado',
    //   cell: ({ row }) => <ActiveBadge active={row.original.active} />,
    // },
  )

  return columns
}

/**
 * Default teachers table columns, scoped to a single department (no
 * department column). Used by `TeachersList`.
 *
 * @example
 * <DataTable columns={teacherColumns} data={data} pageCount={pageCount} {...stateProps} />
 */
export const teacherColumns: ColumnDef<TeacherRecord>[] = buildTeacherColumns()
