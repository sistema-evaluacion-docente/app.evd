import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Director } from '../types'

/**
 * Column definitions for the directors table (user, institutional code,
 * department and status) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={directorColumns} data={directors} pageCount={pageCount} {...stateProps} />
 */
export const directorColumns: ColumnDef<Director>[] = [
  {
    accessorKey: 'user.name',
    header: 'Director',
    cell: ({ row }) => {
      const { user } = row.original

      return (
        <div className="flex items-center gap-3">
          <Avatar className="border-border/70 size-9 border">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback>
              <span className="text-xs font-semibold">{user.name.slice(0, 2).toUpperCase()}</span>
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-foreground text-[15px] leading-tight font-semibold">
              {user.name}
            </span>
            <span className="text-muted-foreground text-xs leading-tight">{user.email}</span>
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

      return (
        <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {code}
        </code>
      )
    },
  },
  {
    accessorKey: 'department.name',
    header: 'Departamento',
    cell: ({ row }) => {
      const { department } = row.original

      return (
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">{department.name}</span>
          <span className="text-muted-foreground text-xs">{department.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'active',
    header: 'Estado',
    cell: ({ getValue }) => {
      const active = getValue<boolean>()

      return <ActiveBadge active={active} activeLabel="Activo" inactiveLabel="Inactivo" />
    },
  },
]
