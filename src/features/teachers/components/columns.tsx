import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TeacherRecord } from '../types'

/**
 * Column definitions for the teachers table (name, institutional code,
 * contract type, average, active) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={teacherColumns} data={data} pageCount={pageCount} {...stateProps} />
 */
export const teacherColumns: ColumnDef<TeacherRecord>[] = [
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
    accessorKey: 'active',
    header: 'Estado',
    cell: ({ row }) => <ActiveBadge active={row.original.active} />,
  },
]
