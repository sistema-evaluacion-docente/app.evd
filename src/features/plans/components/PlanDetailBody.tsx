import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import useAuth from '@/shared/hooks/useAuth'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

import useClosePlan from '../hooks/useClosePlan'
import useEvaluatePlan from '../hooks/useEvaluatePlan'
import useGetPlan from '../hooks/useGetPlan'
import usePlanIndicators from '../hooks/usePlanIndicators'
import { isClosed, statusMeta, TARGET_TYPE_LABEL } from '../lib/planStatus'
import type { CloseResult, PlanItem, PlanStatus } from '../types/Plan'
import { ActaSection } from './ActaSection'
import { EvidencesSection } from './EvidencesSection'

const ITEM_STATUS_CLASS: Record<string, string> = {
  PENDIENTE: 'bg-muted text-muted-foreground',
  EN_PROGRESO: 'bg-sky-50 text-sky-700',
  CUMPLIDO: 'bg-emerald-50 text-emerald-700',
  NO_CUMPLIDO: 'bg-brand-50 text-brand-700',
}

const STAGE_LABEL: Record<string, string> = {
  INICIO: 'Inicio (firma)',
  MITAD: 'Mitad de semestre',
  SEMANA_16: 'Semana 16 (cierre)',
}

export type PlanViewer = 'manager' | 'teacher'

interface PlanDetailBodyProps {
  planId: number
  /** "manager" (director/admin) sees evaluate/close actions; "teacher" only follows up. */
  viewer: PlanViewer
}

/** Full plan detail: header, acta, compromisos, hitos, evidencias y acciones. */
export function PlanDetailBody({ planId, viewer }: PlanDetailBodyProps) {
  const { user } = useAuth()
  const { data, isLoading } = useGetPlan(planId)
  const { data: indicatorsData } = usePlanIndicators()
  const evaluatePlan = useEvaluatePlan()
  const closePlan = useClosePlan()

  const plan = data?.data
  const isManager = viewer === 'manager'

  // Item-level commitments are stored as a question code ("011"): resolve the
  // text so the compromiso is readable without opening the form.
  const questionText = useMemo(() => {
    const texts = new Map<string, string>()
    indicatorsData?.data?.dimensions.forEach((dimension) =>
      dimension.questions.forEach((question) => texts.set(question.code, question.text)),
    )
    return texts
  }, [indicatorsData])

  const closingResult = closePlan.isPending ? closePlan.variables?.data.result : undefined

  const handleEvaluate = () => {
    evaluatePlan.mutate(planId, {
      onSuccess: (res) => {
        const suggestion = res.data?.suggested_result
        toast.success(
          suggestion
            ? `Resultado calculado. Sugerencia: ${suggestion}.`
            : 'Sin notas del periodo de verificación todavía.',
        )
      },
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : 'Error al recalcular.'),
    })
  }

  const handleClose = (result: CloseResult) => {
    closePlan.mutate(
      {
        id: planId,
        data: {
          result,
          reason: result === 'MANUAL' ? 'Cierre manual anticipado' : undefined,
        },
      },
      {
        onSuccess: () => toast.success('Plan cerrado.'),
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : 'Error al cerrar.'),
      },
    )
  }

  if (isLoading || !plan) {
    return (
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    )
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        {/* <Avatar
          name={plan.teacher_name ?? "Docente"}
          size={44}
          paletteIndex={plan.teacher_id}
        /> */}

        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-semibold">{plan.title}</h2>

          <p className="text-muted-foreground mt-1 text-[13px]">
            {plan.teacher_name} · Origen {plan.origin_period_code ?? '—'} → Verificación{' '}
            {plan.verification_period_code ?? 'pendiente'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={plan.status} />

        {plan.suggested_result && !isClosed(plan.status) && (
          <Badge className="bg-amber-50 text-amber-700">
            Sugerencia del sistema: {plan.suggested_result}
          </Badge>
        )}

        <span className="num text-foreground text-[13px] font-semibold">
          Progreso {plan.progress}%
        </span>
      </div>

      {plan.description && (
        <p className="text-muted-foreground text-[13px] leading-snug">{plan.description}</p>
      )}

      <ActaSection plan={plan} canEdit={isManager} />

      <section>
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          Compromisos
        </h4>

        <div className="space-y-2">
          {plan.items.map((item) => (
            <ItemRow key={item.id} item={item} questionText={questionText} />
          ))}
        </div>
      </section>

      {plan.checkpoints.length > 0 && (
        <section>
          <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Seguimiento en 3 etapas
          </h4>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {plan.checkpoints.map((cp) => (
              <div key={cp.id} className="rounded-lg border p-3">
                <div className="text-foreground text-[12.5px] font-semibold">
                  {STAGE_LABEL[cp.stage] ?? cp.stage}
                </div>

                <div className="text-muted-foreground mt-1 text-[11.5px]">
                  {cp.status === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <EvidencesSection plan={plan} currentUserId={user?.id ?? null} canManage={isManager} />

      {isManager && !isClosed(plan.status) && (
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleEvaluate}
            disabled={evaluatePlan.isPending}
          >
            {evaluatePlan.isPending ? <Spinner /> : <RefreshCw className="size-4" />}
            {evaluatePlan.isPending ? 'Recalculando...' : 'Recalcular cumplimiento'}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleClose('MANUAL')}
              disabled={closePlan.isPending}
            >
              {closingResult === 'MANUAL' && <Spinner />}
              Cierre manual
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleClose('NO_CUMPLIDO')}
              disabled={closePlan.isPending}
            >
              {closingResult === 'NO_CUMPLIDO' && <Spinner />}
              Cerrar · No cumplió
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleClose('CUMPLIDO')}
              disabled={closePlan.isPending}
            >
              {closingResult === 'CUMPLIDO' && <Spinner />}
              Cerrar · Cumplió
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export function StatusBadge({ status }: { status: PlanStatus | string }) {
  const meta = statusMeta(status as PlanStatus)

  return <Badge className={cn('border', meta.bg, meta.text, meta.border)}>{meta.label}</Badge>
}

function ItemRow({ item, questionText }: { item: PlanItem; questionText: Map<string, string> }) {
  const target =
    item.target_type === 'QUESTION' && item.target_ref
      ? `${item.target_ref} · ${questionText.get(item.target_ref) ?? ''}`
      : item.target_ref

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-foreground text-[13px]">{item.description}</p>

        <Badge
          className={cn('shrink-0', ITEM_STATUS_CLASS[item.status] ?? ITEM_STATUS_CLASS.PENDIENTE)}
        >
          {item.status}
        </Badge>
      </div>

      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
        <span className="bg-muted rounded px-1.5 py-0.5 font-medium">
          {TARGET_TYPE_LABEL[item.target_type] ?? item.target_type}
          {target ? ` · ${target}` : ''}
        </span>

        {item.baseline_value != null && <span>Base: {item.baseline_value.toFixed(2)}</span>}

        {item.target_value != null && <span>Meta: ≥ {item.target_value.toFixed(2)}</span>}

        {item.result_value != null && (
          <span className="text-foreground font-semibold">
            Resultado: {item.result_value.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  )
}
