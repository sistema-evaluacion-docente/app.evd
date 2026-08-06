import type { ColumnDef } from '@tanstack/react-table'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import formatDate from '@/lib/formatDate'
import type { Setting } from '../types'

/**
 * Column definitions for the system settings table (key, value, type,
 * description, author and last update) used by the shared `DataTable`.
 *
 * @example
 * <DataTable columns={settingsColumns} data={settings} pageCount={pageCount} {...stateProps} />
 */
export const settingsColumns: ColumnDef<Setting>[] = [
  {
    accessorKey: 'key',
    header: 'Clave',
    cell: ({ getValue }) => {
      const key = getValue<string>()

      return <span className="font-mono font-medium">{key}</span>
    },
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ getValue }) => {
      const value = getValue<string | null>()

      return <span className="text-muted-foreground text-sm">{value || '—'}</span>
    },
  },
  // {
  //   accessorKey: 'value_type',
  //   header: 'Tipo',
  //   cell: ({ getValue }) => {
  //     const valueType = getValue<string | null>()
  //     const config = valueType ? getValueTypeConfig(valueType) : null

  //     return (
  //       <Badge
  //         className={cn(
  //           'font-medium',
  //           config?.bg ?? 'bg-muted',
  //           config?.text ?? 'text-muted-foreground',
  //         )}
  //       >
  //         {getValueTypeLabel(valueType)}
  //       </Badge>
  //     )
  //   },
  // },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => {
      const description = getValue<string | null>()

      return (
        <div className="max-w-xs truncate text-sm">
          <span className="text-muted-foreground text-wrap">{description || '—'}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'changed_by',
    header: 'Modificado por',
    cell: ({ row }) => {
      const setting = row.original
      const name = setting.changed_by_name || setting.changed_by

      if (!name) {
        return <span className="text-muted-foreground">—</span>
      }

      return (
        <div className="flex items-center gap-2.5">
          <Avatar className="border-border/70 size-7 border">
            <AvatarImage src={setting.changed_by_avatar_url ?? undefined} alt={name} />
            <AvatarFallback>
              <span className="text-[10px] font-semibold">{name.slice(0, 2).toUpperCase()}</span>
            </AvatarFallback>
          </Avatar>

          <span className="text-muted-foreground text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'updated_at',
    header: 'Última actualización',
    cell: ({ getValue }) => {
      const date = getValue<string | null>()

      return <span className="text-muted-foreground">{date ? formatDate(date) : '—'}</span>
    },
  },
]
