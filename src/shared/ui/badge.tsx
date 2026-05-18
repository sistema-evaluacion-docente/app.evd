import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 h-[22px] text-[11px] font-semibold uppercase tracking-[0.04em]',
  {
    variants: {
      variant: {
        neutral: 'bg-ink-100 text-ink-700 border-ink-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        warning: 'bg-amber-50 text-amber-700 border-amber-200/70',
        danger: 'bg-brand-50 text-brand-700 border-brand-100',
        info: 'bg-sky-50 text-sky-700 border-sky-200/70',
        outline: 'bg-white text-ink-700 border-ink-200',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
