import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type InputProps = ComponentProps<'input'> & {
  /** Optional leading icon rendered inside the field. */
  icon?: ReactNode
}

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          {icon}
        </span>
      )}
      <input
        className={cn(
          'h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-[13px] text-ink-900 placeholder:text-ink-400',
          'transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15',
          icon && 'pl-9',
          className,
        )}
        {...props}
      />
    </div>
  )
}
