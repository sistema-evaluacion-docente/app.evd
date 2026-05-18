import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-ink-900 text-white hover:bg-ink-800',
        brand: 'bg-brand-600 text-white hover:bg-brand-700',
        outline:
          'border border-ink-200 bg-white text-ink-800 hover:bg-ink-50 hover:border-ink-300',
        ghost: 'text-ink-700 hover:bg-ink-100',
        soft: 'bg-ink-100 text-ink-800 hover:bg-ink-200',
        link: 'text-brand-600 hover:underline underline-offset-4 px-0 h-auto',
        'brand-ghost': 'text-brand-600 hover:bg-brand-50',
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
