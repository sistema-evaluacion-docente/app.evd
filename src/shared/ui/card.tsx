import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-card',
        className,
      )}
      {...props}
    />
  )
}
