import type { ColumnDef } from '@tanstack/react-table'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import { getOperationLabel, getOperationToneClass, getTableLabel } from '../config'
import type { AuditLog } from '../types'

/**
 * Column definitions for the audit logs table (actor, entity, operation,
 * element, description and date) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={auditLogColumns} data={logs} pageCount={pageCount} {...stateProps} />
 */
export const auditLogColumns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: 'user',
    id: 'user',
    header: 'Usuario',
    cell: ({ row }) => {
      const user = row.original.user

      if (!user) {
        return <span className="text-muted-foreground text-sm">Sistema</span>
      }

      return (
        <div className="flex items-center gap-3">
          <Avatar className="border-border/70 size-9 border">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name ?? 'Usuario'} />
            <AvatarFallback>
              <span className="text-xs font-semibold">
                {(user.name ?? 'U').slice(0, 2).toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-foreground text-[15px] leading-tight font-semibold">
              {user.name ?? 'Sistema'}
            </span>
            {user.email ? (
              <span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
            ) : null}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'table_name',
    header: 'Entidad',
    cell: ({ getValue }) => {
      const tableName = getValue<string | null>()

      return <span className="text-muted-foreground">{getTableLabel(tableName)}</span>
    },
  },
  {
    accessorKey: 'operation',
    header: 'Operación',
    cell: ({ getValue }) => {
      const operation = getValue<string | null>()

      return (
        <Badge className={cn('font-medium uppercase', getOperationToneClass(operation))}>
          {getOperationLabel(operation)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const date = getValue<string | null>()

      return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
    },
  },
]
