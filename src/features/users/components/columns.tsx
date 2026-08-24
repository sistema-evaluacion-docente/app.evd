import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { STATUS_TONE_CLASS } from '@/lib/statusTone'
import { cn } from '@/lib/utils'
import { getRoleLabel } from '../config'
import type { AdminUser } from '../types'

/**
 * Column definitions for the users table (user, code, department, roles,
 * status and creation date) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={userColumns} data={users} pageCount={pageCount} {...stateProps} />
 */
export const userColumns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: 'name',
    header: 'Usuario',
    cell: ({ row }) => {
      const user = row.original

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
              {user.name ?? '—'}
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
    accessorKey: 'institutional_code',
    header: 'Código',
    cell: ({ getValue }) => {
      const code = getValue<string | null>()

      return code ? (
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {code}
        </code>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ getValue }) => {
      const roles = getValue<string[]>()

      return (
        <div className="flex flex-wrap gap-1.5">
          {/* Pastilla suave, como el resto de badges de la app: el `secondary`
              por defecto pinta el azul institucional a saturación plena con
              texto blanco, y tres roles seguidos leían como tres botones. */}
          {roles.map((role) => (
            <Badge key={role} className={cn('font-medium', STATUS_TONE_CLASS.accent)}>
              {getRoleLabel(role)}
            </Badge>
          ))}
        </div>
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
]
