import type { ColumnDef } from '@tanstack/react-table'

import { ActiveBadge } from '@/components/common/ActiveBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import formatDate from '@/lib/formatDate'
import type { Department } from '../types'

/**
 * Column definitions for the departments table (name, code, director, faculty,
 * status, teachers, date) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={departmentColumns} data={departments} pageCount={pageCount} {...stateProps} />
 */
export const departmentColumns: ColumnDef<Department>[] = [
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
    accessorKey: 'director',
    header: 'Director',
    cell: ({ row }) => {
      const director = row.original.director

      if (!director) {
        return <span className="text-muted-foreground text-sm">Sin asignar</span>
      }

      return (
        <div className="flex items-center gap-2">
          <Avatar className="border-border/70 size-7 border">
            <AvatarImage src={director.avatar_url ?? undefined} alt={director.name} />
            <AvatarFallback>
              <span className="text-xs font-semibold">
                {director.name.slice(0, 2).toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground text-sm">{director.name}</span>
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
  {
    accessorKey: 'teacher_count',
    header: 'Docentes',
    cell: ({ getValue }) => {
      const count = getValue<number>()

      return (
        <div className="flex items-center gap-1.5">
          <span className="text-foreground font-medium tabular-nums">{count}</span>
          <span className="text-muted-foreground text-xs">
            {count === 1 ? 'docente' : 'docentes'}
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
