import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface StatTileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  valueClassName?: string
  className?: string
}
export function StatTile({ label, value, sub, icon, valueClassName, className }: StatTileProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="text-md text-muted-foreground font-semibold tracking-widest uppercase">
          {label}
        </div>

        {icon}
      </div>

      <div
        className={cn(
          'text-5xl font-semibold',
          valueClassName ?? 'text-foreground',
        )}
      >
        {value}
      </div>

      {sub && <div className="text-muted-foreground text-sm">{sub}</div>}
    </Card>
  )
}
