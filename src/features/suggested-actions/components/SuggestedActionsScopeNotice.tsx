import { Building2, Info } from 'lucide-react'

import { DismissibleNotice } from '@/components/common/DismissibleNotice'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Setting } from '@/features/admin'
import { isDepartmentOwnedSetting } from '@/features/admin'

interface SuggestedActionsScopeNoticeProps {
  /** The setting the list came from; `null` when the key has no value yet. */
  setting: Setting | null
  /** Drops the department's own list so the institutional one applies again. */
  onReset: () => void
  isResetting?: boolean
}

/**
 * Says where the list on screen comes from, which is the one thing about this
 * page that is not visible in the table: an institutional list is read-only
 * for a director, and the first change they save turns it into a copy of their
 * own. Saying so up front is what keeps that from happening by surprise.
 *
 * @example
 * <SuggestedActionsScopeNotice setting={setting} onReset={reset} />
 */
export function SuggestedActionsScopeNotice({ setting }: SuggestedActionsScopeNoticeProps) {
  if (setting && isDepartmentOwnedSetting(setting)) {
    return (
      <DismissibleNotice storageKey="suggested-actions-scope-own" className="mb-4">
        <Alert className="pr-10">
          <Building2 aria-hidden="true" />

          <AlertTitle>Lista propia de {setting.department_name ?? 'tu departamento'}</AlertTitle>

          <AlertDescription>
            Estas acciones se ofrecen al redactar los planes de mejoramiento de tu departamento.
          </AlertDescription>
        </Alert>
      </DismissibleNotice>
    )
  }

  return (
    <DismissibleNotice storageKey="suggested-actions-scope-institutional" className="mb-4">
      <Alert className="pr-10">
        <Info aria-hidden="true" />

        <AlertTitle>
          {setting
            ? 'Estás viendo las acciones institucionales'
            : 'Todavía no hay acciones sugeridas'}
        </AlertTitle>

        <AlertDescription>
          {setting
            ? 'Son las que mantiene la administración y solo ella puede editarlas. El primer cambio que guardes creará una lista propia de tu departamento, sin tocar la institucional.'
            : 'Agrega la primera para que aparezca como sugerencia al redactar los planes de mejoramiento de tu departamento.'}
        </AlertDescription>
      </Alert>
    </DismissibleNotice>
  )
}
