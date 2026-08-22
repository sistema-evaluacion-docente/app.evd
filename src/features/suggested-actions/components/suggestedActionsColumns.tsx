import type { ColumnDef } from '@tanstack/react-table'

import { DimensionDot } from '@/components/common/DimensionDot'
import type { PlanAspect } from '@/features/plans'
import type { SuggestedAction } from '../types'

/**
 * Column definitions for the suggested actions table. Built from the aspect
 * catalogue rather than a constant, so the five sections of the official forms
 * stay whatever `GET /improvement-plans/indicators` says they are.
 *
 * @example
 * <DataTable columns={suggestedActionsColumns(aspects)} data={actions} {...stateProps} />
 */
export function suggestedActionsColumns(aspects: PlanAspect[]): ColumnDef<SuggestedAction>[] {
  const byNumber = new Map(aspects.map((aspect) => [aspect.aspect, aspect]))

  return [
    {
      accessorKey: 'aspect',
      header: 'Aspecto',
      cell: ({ getValue }) => {
        const number = getValue<number>()
        const aspect = byNumber.get(number)

        return (
          <div className="flex max-w-56 items-center gap-2">
            <DimensionDot dimension={aspect?.dimension} />

            <span className="text-sm">
              <span className="text-muted-foreground num mr-1">{number}.</span>
              {aspect?.label ?? 'Sin aspecto'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'action',
      header: 'Acción',
      cell: ({ getValue }) => <span className="block text-sm text-wrap">{getValue<string>()}</span>,
    },
  ]
}
