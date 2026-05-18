import type { ReactNode } from 'react'

import { Card } from './card'
import { cn } from '@/shared/lib/utils'

export interface StatTileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  valueClassName?: string
  className?: string
}

/** Compact metric tile: uppercase label, large numeric value, optional sub-text. */
export function StatTile({
  label,
  value,
  sub,
  icon,
  valueClassName,
  className,
}: StatTileProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
          {label}
        </div>
        {icon}
      </div>
      <div
        className={cn(
          'num mt-2.5 text-[28px] font-semibold leading-none tabular-nums',
          valueClassName ?? 'text-ink-900',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-2 text-[12px] text-ink-500">{sub}</div>}
    </Card>
  )
}
