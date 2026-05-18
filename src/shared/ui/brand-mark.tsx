import { Landmark } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export interface BrandMarkProps {
  size?: number
  className?: string
  iconSize?: number
}

/** Institutional logo glyph used in the sidebar and login screen. */
export function BrandMark({ size = 36, className, iconSize }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-brand-600 text-white',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Landmark size={iconSize ?? Math.round(size * 0.5)} strokeWidth={1.75} />
    </div>
  )
}
