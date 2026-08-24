import { DismissibleNotice } from '@/components/common/DismissibleNotice'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

/**
 * Explains where the alerts on screen come from: a model suggests the risk
 * level, the director decides it. Stated up front so a list of "high risk"
 * comments is never read as a verdict — the one thing about this page that is
 * not visible from the comments themselves.
 *
 * @example
 * <AlertsAiNotice />
 */
export function AlertsAiNotice() {
  return (
    <DismissibleNotice storageKey="alerts-ai" className="mb-4">
      <Alert className="pr-10">
        <Info aria-hidden="true" />

        <AlertTitle>Estas alertas las sugiere un modelo de IA</AlertTitle>

        <AlertDescription>
          El nivel de riesgo lo asigna DistilBETO, un modelo de IA entrenado por nosotros, y puede
          equivocarse. Si no estás de acuerdo, cambia el nivel desde el comentario: la decisión
          final es tuya.
        </AlertDescription>
      </Alert>
    </DismissibleNotice>
  )
}
