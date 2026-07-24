import { cn } from '@/lib/utils'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { statusMeta } from '../lib/planStatus'
import type { Plan } from '../types/Plan'

const columnHelper = createColumnHelper<Plan>()

export default function usePlanColumns() {
  return useMemo(
    () => [
      columnHelper.accessor('teacher_name', {
        header: 'Docente',
        cell: (info) => {
          const plan = info.row.original
          const name = info.getValue() ?? 'Docente'

          return (
            <div className="flex items-center gap-3">
              {/* <Avatar name={name} size={40} paletteIndex={plan.teacher_id} /> */}
              <div className="leading-tight">
                <div className="text-foreground text-[14px] font-semibold">{name}</div>
                <div className="text-muted-foreground mt-0.5 text-[12.5px]">
                  Origen {plan.origin_period_code ?? '—'}
                </div>
              </div>
            </div>
          )
        },
      }),

      columnHelper.accessor('title', {
        header: 'Plan de Seguimiento',
        cell: (info) => {
          const plan = info.row.original

          return (
            <div className="max-w-95">
              <div className="text-foreground text-[14px] leading-snug font-semibold">
                {info.getValue()}
              </div>
              <div className="text-muted-foreground mt-0.5 text-[12px]">
                {plan.items.length} compromiso(s) · Verif.{' '}
                {plan.verification_period_code ?? 'pendiente'}
              </div>
            </div>
          )
        },
      }),

      columnHelper.accessor('progress', {
        header: 'Progreso',
        cell: (info) => {
          const progress = info.getValue()
          const meta = statusMeta(info.row.original.status)

          return (
            <div className="min-w-37.5">
              <div className="mb-1.5">
                <span className={cn('num text-[13px] font-semibold tabular-nums', meta.text)}>
                  {progress}%
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full transition-all duration-500', meta.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        },
      }),

      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const meta = statusMeta(info.getValue())

          return (
            <span
              className={cn(
                'inline-flex h-7 items-center justify-center rounded-full border px-3 text-[12px] font-semibold whitespace-nowrap',
                meta.bg,
                meta.text,
                meta.border,
              )}
            >
              {meta.label}
            </span>
          )
        },
      }),
    ],
    [],
  )
}
