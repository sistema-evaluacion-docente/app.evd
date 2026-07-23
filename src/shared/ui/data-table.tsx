import { Fragment, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export interface DataTableColumn<T> {
  header: ReactNode
  cell: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  headerVariant?: 'default' | 'muted' | 'dark'
  minWidth?: number
  emptyMessage?: string
  rowClassName?: string | ((row: T) => string)
  /** Key of the row whose expanded content is currently open. */
  expandedKey?: string | number | null
  renderExpanded?: (row: T) => ReactNode
}

const HEADER_VARIANTS = {
  default: 'border-b text-muted-foreground',
  muted: 'border-b  text-muted-foreground',
  // Stays dark in both themes: ink-* flips with the theme, so an ink-900 bar
  // would turn white here and read as a glaring band across the page.
  dark: 'bg-background text-foreground/80 border-b',
}

/**
 * Generic, column-driven table. Each column declares its header and a cell
 * renderer; rows can optionally expand into a custom detail panel.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  headerVariant = 'muted',
  minWidth = 860,
  emptyMessage = 'Sin resultados.',
  rowClassName,
  expandedKey,
  renderExpanded,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth }}>
        <thead>
          <tr
            className={cn(
              'text-xs font-semibold tracking-[0.08em] uppercase',
              HEADER_VARIANTS[headerVariant],
            )}
          >
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  'px-5 py-3 text-left font-semibold first:pl-6 last:pr-6',
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const key = rowKey(row)
            const extraRowClass =
              typeof rowClassName === 'function' ? rowClassName(row) : rowClassName

            return (
              <Fragment key={key}>
                <tr
                  className={cn(
                    'hover:bg-muted-foreground/5 border-b transition-colors last:border-b-0',
                    extraRowClass,
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={cn('px-5 align-middle first:pl-6 last:pr-6', column.cellClassName)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>

                {renderExpanded && expandedKey === key && (
                  <tr className="border-b">
                    <td colSpan={columns.length} className="p-0">
                      {renderExpanded(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text text-muted-foreground py-16 text-center">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
