import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import formatDate from '@/lib/formatDate'
import type { AcademicPeriod } from '../../types'

/**
 * Column definitions for the academic periods admin table.
 *
 * @example
 * <DataTable columns={periodAdminColumns} data={periods} pageCount={pageCount} {...stateProps} />
 */
export const periodAdminColumns: ColumnDef<AcademicPeriod>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ getValue }) => {
      const name = getValue<string>()

      return <span className="text-foreground font-medium">{name}</span>
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
