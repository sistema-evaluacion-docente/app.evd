import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import formatDate from '@/lib/formatDate'
import type { Program } from '../types'

/**
 * Column definitions for the academic programs table (name, code, status,
 * date) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={programColumns} data={programs} pageCount={pageCount} {...stateProps} />
 */
export const programColumns: ColumnDef<Program>[] = [
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
    accessorKey: 'created_at',
    header: 'Fecha de creación',
    cell: ({ getValue }) => {
      const date = getValue<string | null>()

      return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
    },
  },
]
