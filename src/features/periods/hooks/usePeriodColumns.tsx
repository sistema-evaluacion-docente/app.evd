import { Badge } from '@/components/ui/badge'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import type { Period } from '../types/Period'

const columnHelper = createColumnHelper<Period>()

/**
 * Custom hook that defines the columns for the academic periods data table.
 *
 * @returns {Array} An array of column definitions for the data table.
 */
export default function usePeriodColumns() {
  return useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nombre',
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor('start_date', {
        header: 'Inicio',
        cell: (info) => <span>{info.getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('end_date', {
        header: 'Cierre',
        cell: (info) => <span>{info.getValue() ?? '-'}</span>,
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
