import { Badge } from '@/components/ui/badge'
import { STATUS_TONE_CLASS } from '@/lib/statusTone'

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
    <Badge className={active ? STATUS_TONE_CLASS.success : STATUS_TONE_CLASS.warning}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}
