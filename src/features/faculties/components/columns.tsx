import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import formatDate from '@/lib/formatDate'
import type { Faculty } from '../types'

/**
 * Column definitions for the faculties table (name, code, status, departments,
 * date) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={facultyColumns} data={faculties} pageCount={pageCount} {...stateProps} />
 */
export const facultyColumns: ColumnDef<Faculty>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ getValue }) => {
      const name = getValue<string>()

      return <span className="text-foreground font-medium">{name}</span>
    },
  },
  {
    accessorKey: 'code',
    header: 'Código',
    cell: ({ getValue }) => {
      const code = getValue<string>()

      return (
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {code}
        </code>
      )
    },
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    cell: ({ getValue }) => {
      const active = getValue<boolean>()

      return <ActiveBadge active={active} />
    },
  },
  {
    accessorKey: 'department_count',
    header: 'Departamentos',
    cell: ({ getValue }) => {
      const count = getValue<number>()

      return (
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium tabular-nums">{count}</span>
          <span className="text-muted-foreground">
            {count === 1 ? 'departamento' : 'departamentos'}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha de creación',
    cell: ({ getValue }) => {
      const date = getValue<string | null>()

      return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
    },
  },
]
