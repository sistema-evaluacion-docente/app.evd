import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import type { Department } from '../types/Department'

const columnHelper = createColumnHelper<Department>()

/**
 * Custom hook to define the columns for the departments table.
 * @returns An array of column definitions for the departments table.
 */
export default function useDepartmentColumns() {
  return useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),

      columnHelper.accessor('name', {
        header: 'Nombre',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),

      columnHelper.accessor('code', {
        header: 'Código',
        cell: (info) => {
          const code = info.getValue()
          return code ?? <span className="text-muted-foreground">—</span>
        },
      }),

      columnHelper.accessor('director', {
        header: 'Director',
        cell: (info) => {
          const director = info.getValue()

          if (!director) {
            return <span className="text-muted-foreground">Sin director</span>
          }

          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={director.avatar_url} />
                <AvatarFallback>{director.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>

              <span className="text-sm">{director.name}</span>
            </div>
          )
        },
      }),

      columnHelper.accessor('active', {
        header: 'Activo',
        cell: (info) => (
          <Badge
            className={info.getValue() ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}
          >
            {info.getValue() ? 'Sí' : 'No'}
          </Badge>
        ),
      }),
    ],
    [],
  )
}
