import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background hover:bg-foreground/90',
        brand: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline:
          'border border-border bg-card text-foreground hover:bg-muted hover:border-border',
        ghost: 'text-foreground hover:bg-muted',
        soft: 'bg-muted text-foreground hover:bg-muted/80',
        // Red *text* uses brand-700, not the pinned brand-600: the dark ramp
        // lightens 700 (and darkens the 50 tint) on its own, so no dark: here.
        link: 'text-brand-700 hover:underline underline-offset-4 px-0 h-auto',
        'brand-ghost': 'text-brand-700 hover:bg-brand-50',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-3.5 text-[13px]',
        lg: 'h-10 px-4 text-sm',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
