import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Eraser, ListChecks, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { TeacherComment } from '@/features/teachers/types'
import { useGetPlanCandidates, useGetPlanIndicators, useGetPlanPeriods } from '../api'
import { usePlanWorkbench } from '../hooks/usePlanWorkbench'
import { SUBJECT_ALL } from '../lib/indicatorMatrix'
import { commentSelectionId, indicatorSelectionId, type IndicatorPick } from '../lib/planDraft'
import { formatPicks, type PlanPick } from '../lib/planPicks'
import { indicatorKey } from '../lib/planStatus'
import { IndicatorPicker } from './IndicatorPicker'

interface IndicatorSelectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: number
  teacherName?: string
  /** `period_code` of the profile, which is the period every score belongs to. */
  periodCode?: string
  /**
   * Where the selection is taken. `new` starts a plan; an id adds to the plan
   * that period already has, which is the only way a second commitment reaches
   * an existing agreement.
   */
  target: { kind: 'new' } | { kind: 'edit'; planId: number }
}

/** A marked row, with everything needed to serialise it and to list it back. */
interface Marked extends PlanPick {
  /** How the row reads in "Ver selección": «011 · Asiste puntualmente…». */
  label: string
  /** The asignatura's own label, or `null` at teacher level. */
  subjectLabel: string | null
}

/**
 * Gathers the indicators a director wants a plan to be about, from the
 * teacher's own profile, and hands them to the plan form.
 *
 * It mounts the same `IndicatorPicker` the form uses, in `select` mode: the
 * panel is the one place the two screens must not drift, since it is the same
 * twenty-one indicators, the same «solo bajos» filter and the same subject
 * scope. Nothing is written here — the commitments are drafted on the form,
 * where the whole plan is in view.
 *
 * @example
 * <IndicatorSelectionSheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   teacherId={teacher.teacher_id}
 *   periodCode={teacher.period_code}
 *   target={{ kind: 'new' }}
 * />
 */
export function IndicatorSelectionSheet({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  periodCode,
  target,
}: IndicatorSelectionSheetProps) {
  const [, navigate] = useLocation()

  const [onlyWeak, setOnlyWeak] = useState(true)
  const [subjectKey, setSubjectKey] = useState(SUBJECT_ALL)
  const [marked, setMarked] = useState<ReadonlyMap<string, Marked>>(() => new Map())

  // Held back until the panel opens: the profile should not pay for three
  // requests a director may never ask for. Once open they stay in the query
  // cache, so the plan form that comes next loads from it.
  const { data: periodsResponse } = useGetPlanPeriods(undefined, { enabled: open })
  const periods = periodsResponse?.data ?? []
  const period = periodCode ? periods.find((entry) => entry.code === periodCode) : periods[0]

  const { data: indicatorsResponse } = useGetPlanIndicators({ enabled: open })
  const catalogue = indicatorsResponse?.data
  const threshold = catalogue?.threshold ?? 3.5

  const { data: candidatesResponse } = useGetPlanCandidates(open ? period?.id : undefined)
  const candidate = candidatesResponse?.data?.find((entry) => entry.teacher_id === teacherId)

  const workbench = usePlanWorkbench({
    teacherId: open ? teacherId : undefined,
    periodId: period?.id,
    periodName: period?.name ?? period?.code,
    candidate,
    catalogue,
    threshold,
    onlyWeak,
    subjectKey,
  })

  const aspectByDimension = useMemo(
    () =>
      Object.fromEntries(
        (catalogue?.aspects ?? [])
          .filter((aspect) => aspect.dimension)
          .map((aspect) => [aspect.dimension as string, aspect.aspect]),
      ),
    [catalogue],
  )

  const selectedIds = useMemo(() => new Set(marked.keys()), [marked])

  /** The asignatura a mark is filed under, `null` while on «General». */
  const scope = workbench.activeSubject

  function toggle(id: string, entry: Marked) {
    setMarked((current) => {
      const next = new Map(current)

      if (next.has(id)) next.delete(id)
      else next.set(id, entry)

      return next
    })
  }

  function toggleIndicator(pick: IndicatorPick) {
    const id = indicatorSelectionId(scope?.key ?? null, pick.target_type, pick.target_ref)

    toggle(id, {
      kind: pick.target_type === 'DIMENSION' ? 'dimension' : 'question',
      // A dimension travels by aspect number, a question by its code — which is
      // what `target_ref` already is.
      ref: pick.target_type === 'DIMENSION' ? String(pick.aspect ?? '') : pick.target_ref,
      subjectKey: scope?.key ?? null,
      label: pick.label,
      subjectLabel: scope?.label ?? null,
    })
  }

  function toggleComment(comment: TeacherComment) {
    toggle(commentSelectionId(comment.id), {
      kind: 'comment',
      ref: String(comment.id),
      subjectKey: scope?.key ?? null,
      label: `Comentario de estudiantes${comment.course_name ? ` · ${comment.course_name}` : ''}`,
      subjectLabel: scope?.label ?? null,
    })
  }

  /**
   * Marks everything below the institutional threshold in the current scope.
   *
   * With twenty-one indicators, the three to six that are actually low is the
   * whole answer nine times out of ten. Offered rather than pre-applied: a
   * selection made for the director is a decision taken from him.
   */
  function markWeak() {
    setMarked((current) => {
      const next = new Map(current)

      for (const dimension of workbench.dimensions) {
        for (const question of dimension.questions) {
          if (!question.below_threshold) continue

          const id = indicatorSelectionId(scope?.key ?? null, 'QUESTION', question.target_ref)

          if (next.has(id)) continue

          next.set(id, {
            kind: 'question',
            ref: question.code,
            subjectKey: scope?.key ?? null,
            label: `${question.code} · ${question.text}`,
            subjectLabel: scope?.label ?? null,
          })
        }
      }

      return next
    })
  }

  /** How many weak questions the shortcut would add on top of what is marked. */
  const weakToAdd = useMemo(
    () =>
      workbench.dimensions
        .flatMap((dimension) => dimension.questions)
        .filter(
          (question) =>
            question.below_threshold &&
            !selectedIds.has(
              indicatorSelectionId(scope?.key ?? null, 'QUESTION', question.target_ref),
            ),
        ).length,
    [workbench.dimensions, selectedIds, scope],
  )

  /**
   * How many marks each indicator already carries, across every asignatura.
   *
   * The picker shows a row as marked only under the asignatura it was marked in;
   * this is what tells the director that the same indicator is already down for
   * another one, so marking it here is a second commitment on purpose.
   */
  const committedCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const entry of marked.values()) {
      if (entry.kind === 'comment') continue

      const key =
        entry.kind === 'dimension'
          ? indicatorKey('DIMENSION', dimensionNameOf(entry.ref, aspectByDimension))
          : indicatorKey('QUESTION', entry.ref)

      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return counts
  }, [marked, aspectByDimension])

  /** `[selection_id, entry]`, which is what the list needs to remove one. */
  const entries = [...marked.entries()]

  function remove(id: string) {
    setMarked((current) => {
      const next = new Map(current)

      next.delete(id)

      return next
    })
  }

  function submit() {
    const picks = formatPicks(
      entries.map(([, { kind, ref, subjectKey: key }]) => ({ kind, ref, subjectKey: key })),
    )

    const base =
      target.kind === 'edit'
        ? `/planes/${target.planId}/editar`
        : `/planes/nuevo?teacher=${teacherId}${
            periodCode ? `&period_code=${encodeURIComponent(periodCode)}` : ''
          }`

    const separator = base.includes('?') ? '&' : '?'

    onOpenChange(false)
    navigate(`${base}${separator}picks=${encodeURIComponent(picks)}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-2xl"
        aria-label="Seleccionar indicadores para el plan de mejoramiento"
      >
        <SheetHeader className="border-border border-b px-5 py-4 pr-14">
          <SheetTitle>Indicadores para el plan</SheetTitle>
          <SheetDescription>
            {teacherName ? `${teacherName} · ` : ''}
            {period?.name ?? period?.code ?? 'Periodo del perfil'}
            {' · '}
            Marca lo que el docente debe mejorar; los compromisos se redactan en el formulario.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {weakToAdd > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markWeak}
              className="mb-4 w-full justify-start"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Seleccionar {weakToAdd === 1 ? 'el indicador' : `los ${weakToAdd} indicadores`} por
              debajo de <span className="num">{threshold.toFixed(1)}</span>
            </Button>
          )}

          <IndicatorPicker
            mode="select"
            dimensions={workbench.dimensions}
            threshold={threshold}
            comments={workbench.comments}
            selectedIds={selectedIds}
            committedCounts={committedCounts}
            onToggleIndicator={toggleIndicator}
            onToggleComment={toggleComment}
            aspectByDimension={aspectByDimension}
            onlyWeak={onlyWeak}
            onOnlyWeakChange={setOnlyWeak}
            subjectOptions={workbench.subjectOptions}
            subjectKey={workbench.effectiveSubjectKey}
            onSubjectChange={setSubjectKey}
            isLoading={workbench.isLoading || !catalogue}
            weakCount={workbench.weakCount}
            riskyCount={workbench.riskyCount}
            aiStatus={workbench.aiStatus}
          />
        </div>

        <div className="border-border bg-background flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/* Announced, not only painted: the count is the one piece of state
                the whole panel is about. */}
            <p role="status" aria-live="polite" className="text-sm">
              {entries.length === 0 ? (
                <span className="text-muted-foreground">
                  Marca los indicadores que el docente debe mejorar
                </span>
              ) : (
                <>
                  <span className="num font-semibold">{entries.length}</span>{' '}
                  {entries.length === 1 ? 'seleccionado' : 'seleccionados'}
                </>
              )}
            </p>

            {entries.length > 0 && (
              <>
                <SelectionPopover entries={entries} onRemove={remove} />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMarked(new Map())}
                  className="text-muted-foreground"
                >
                  <Eraser className="size-3.5" aria-hidden="true" />
                  Limpiar
                </Button>
              </>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button type="button" size="sm" disabled={entries.length === 0} onClick={submit}>
              <ListChecks className="size-4" aria-hidden="true" />
              {target.kind === 'edit' ? 'Agregar al plan' : 'Crear plan'}
              {entries.length > 0 && (
                <>
                  {' con '}
                  <span className="num">{entries.length}</span>
                </>
              )}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Lists what is marked, with the asignatura each one is filed under.
 *
 * Not a nicety: a row can be marked inside a dimension that is then collapsed,
 * or under an asignatura the filter has since moved off. Without this the
 * director cannot see what he is about to hand over.
 */
function SelectionPopover({
  entries,
  onRemove,
}: {
  entries: [string, Marked][]
  onRemove: (id: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" />
        }
      >
        Ver selección
      </PopoverTrigger>

      <PopoverContent align="start" className="max-h-80 w-80 overflow-y-auto p-0">
        <ul className="divide-border divide-y">
          {entries.map(([id, entry]) => (
            <li key={id} className="flex items-start justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs">{entry.label}</p>
                <p className="text-muted-foreground text-xs">
                  {entry.subjectLabel ?? 'General · todas las asignaturas'}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(id)}
                aria-label={`Quitar ${entry.label} de la selección`}
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** The dimension an aspect number stands for, for the count of marks. */
function dimensionNameOf(aspect: string, aspectByDimension: Record<string, number>): string {
  const found = Object.entries(aspectByDimension).find(([, value]) => String(value) === aspect)

  return found?.[0] ?? aspect
}
