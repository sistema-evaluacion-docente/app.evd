import { hashString, initialsOf } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

const AVATAR_PALETTES = [
  'bg-brand-50 text-brand-700 ring-brand-100',
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
  'bg-rose-50 text-rose-700 ring-rose-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
]

export interface AvatarProps {
  name: string
  /** Optional image URL. When provided, shows the photo instead of initials. */
  src?: string
  size?: number
  /** Force a palette index; otherwise derived from the name hash. */
  paletteIndex?: number
  className?: string
}

/** Circular avatar — shows a photo when `src` is provided, otherwise colored initials. */
export function Avatar({ name, src, size = 36, paletteIndex, className }: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn('inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-ink-200', className)}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  const palette =
    AVATAR_PALETTES[(paletteIndex ?? hashString(name)) % AVATAR_PALETTES.length]
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold ring-1',
        palette,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  )
}
