import { AlertTriangle, CheckCircle2, MessageSquareWarning, ScanSearch } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import formatDate from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import { VERIFICATION_RESULT_CLASS, VERIFICATION_RESULT_LABEL } from '../lib/planStatus'
import {
  alertComments,
  contextComments,
  hasFindings,
  hiddenWeakCourses,
  indicatorLabel,
} from '../lib/verification'
import type {
  PlanVerification as Verification,
  PlanVerificationComment,
  PlanVerificationItem,
} from '../types'

interface PlanVerificationProps {
  verification: Verification | null
  /** Shown when the grades that would settle the plan have not arrived yet. */
  verificationPeriodCode: string | null
}

/**
 * What the semester *after* the plan said about it.
 *
 * The plan is closed when the Formato 3 is signed, at the end of the
 * accompaniment — before the grades that would prove the teacher improved
 * exist. So this is not part of the closing and never rewrites it: the plan
 * keeps the result the director signed, and this is the answer that arrived
 * later, on its own, when the evaluation of the verification period was
 * uploaded.
 *
 * @example
 * <PlanVerification
 *   verification={plan.verification}
 *   verificationPeriodCode={plan.verification_period_code}
 * />
 */
export function PlanVerification({ verification, verificationPeriodCode }: PlanVerificationProps) {
  const period = verification?.period_code ?? verificationPeriodCode

  return (
    <section className="border-border bg-card overflow-hidden rounded-md border">
      <header className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <ScanSearch className="text-muted-foreground size-4" aria-hidden="true" />
            Verificación del semestre siguiente
          </h2>
          <p className="text-muted-foreground text-sm">
            Compara las metas acordadas con las notas de {period ?? 'el periodo de verificación'}.
            No modifica el resultado con el que se cerró el plan.
          </p>
        </div>

        {verification && (
          <Badge className={VERIFICATION_RESULT_CLASS[verification.result]}>
            {VERIFICATION_RESULT_LABEL[verification.result]}
          </Badge>
        )}
      </header>

      {!verification || !hasFindings(verification) ? (
        <p className="text-muted-foreground px-6 py-4 text-sm">
          {period
            ? `Aún no se han cargado las notas de ${period}. La verificación se hace sola en cuanto se suban.`
            : 'Este plan no tiene un periodo de verificación asignado, así que no hay notas contra las cuales compararlo.'}
        </p>
      ) : (
        <VerificationBody verification={verification} />
      )}
    </section>
  )
}

function VerificationBody({ verification }: { verification: Verification }) {
  const hidden = hiddenWeakCourses(verification)
  const alerts = alertComments(verification)
  const context = contextComments(verification)

  return (
    <div className="divide-border divide-y">
      {verification.items.length > 0 && (
        <ul className="divide-border divide-y">
          {verification.items.map((item) => (
            <IndicatorRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {hidden.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 px-6 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">
              Alcanzó la meta en su promedio general, pero sigue bajo en{' '}
              {hidden.length === 1 ? 'una asignatura' : `${hidden.length} asignaturas`}.
            </p>
            <ul className="mt-1 space-y-0.5">
              {hidden.map(({ item, course }) => (
                <li key={`${item.id}-${course.id}`}>
                  {courseName(course.course_name, course.group_name)} ·{' '}
                  {indicatorLabel(item.target_type, item.target_ref)} en{' '}
                  <span className="font-semibold">{score(course.result_value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(alerts.length > 0 || context.length > 0) && (
        <CommentFindings alerts={alerts} context={context} />
      )}

      {verification.scores_verified_at && (
        <p className="text-muted-foreground px-6 py-3 text-xs">
          Verificado el {formatDate(verification.scores_verified_at)}.
        </p>
      )}
    </div>
  )
}

/** One agreed target: what was promised, what the new grades say. */
function IndicatorRow({ item }: { item: PlanVerificationItem }) {
  const measured = item.met !== null

  return (
    <li className="px-6 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium">{indicatorLabel(item.target_type, item.target_ref)}</p>

        {measured ? (
          <Badge
            className={cn(
              item.met
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
            )}
          >
            {item.met ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-3.5" aria-hidden="true" />
            )}
            {item.met ? 'Alcanzada' : 'No alcanzada'}
          </Badge>
        ) : (
          <Badge className="bg-muted text-muted-foreground">Sin notas</Badge>
        )}
      </div>

      <p className="text-muted-foreground mt-0.5 text-sm">
        Meta <span className="text-foreground font-semibold">{score(item.target_value)}</span> ·{' '}
        {measured ? (
          <>
            resultado{' '}
            <span className="text-foreground font-semibold">{score(item.result_value)}</span>
          </>
        ) : (
          'el periodo de verificación no tiene notas de este indicador'
        )}
      </p>

      {item.courses.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {item.courses.map((course) => (
            <li key={course.id}>
              <Badge
                variant="outline"
                className={cn(
                  'font-normal',
                  !course.met &&
                    'border-red-300 text-red-700 dark:border-red-900 dark:text-red-300',
                )}
              >
                {courseName(course.course_name, course.group_name)} {score(course.result_value)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * The student comments that came back.
 *
 * Never a verdict — there is no number to compare a comment against — so it
 * reads as reincidencia and the comments are printed for the director to judge.
 */
function CommentFindings({
  alerts,
  context,
}: {
  alerts: PlanVerificationComment[]
  context: PlanVerificationComment[]
}) {
  return (
    <div className="px-6 py-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <MessageSquareWarning className="text-muted-foreground size-4" aria-hidden="true" />
        Observaciones de estudiantes que reaparecen
      </h3>

      {alerts.length > 0 && (
        <ul className="mt-2 space-y-2">
          {alerts.map((finding) => (
            <li
              key={finding.id}
              className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
            >
              {finding.category_name && (
                <p className="text-xs font-semibold uppercase">{finding.category_name}</p>
              )}
              <p>{finding.original_text ?? 'Comentario no disponible'}</p>
            </li>
          ))}
        </ul>
      )}

      {context.length > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">
          Además hay {context.length} {context.length === 1 ? 'comentario' : 'comentarios'} de
          riesgo medio en {categoriesOf(context)}. No levantan alerta por sí solos, pero marcan la
          tendencia.
        </p>
      )}
    </div>
  )
}

function score(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

function courseName(name: string | null, group: string | null): string {
  const base = name ?? 'Asignatura sin nombre'

  return group ? `${base} (${group})` : base
}

function categoriesOf(findings: PlanVerificationComment[]): string {
  const names = [...new Set(findings.map((f) => f.category_name).filter(Boolean))]

  return names.length > 0 ? names.join(', ') : 'la misma categoría'
}
