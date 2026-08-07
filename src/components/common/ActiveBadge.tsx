import { Badge } from '@/components/ui/badge'

export interface ActiveBadgeProps {
  /** Whether the entity is active. */
  active: boolean
  /** Label shown when active (defaults to "Activo"). */
  activeLabel?: string
  /** Label shown when inactive (defaults to "Desactivado"). */
  inactiveLabel?: string
}

/**
 * Small status badge that reads "Activo" (emerald) or "Desactivado" (amber)
 * based on a boolean. Customizable labels are supported.
 *
 * @example
 * <ActiveBadge active={row.original.active} />
 * <ActiveBadge active={false} activeLabel="Habilitado" inactiveLabel="Suspendido" />
 */
export function ActiveBadge({
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Desactivado',
}: ActiveBadgeProps) {
  return (
    <Badge className={active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}
