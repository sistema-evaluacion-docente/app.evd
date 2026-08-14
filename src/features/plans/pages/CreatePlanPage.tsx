import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { Save } from 'lucide-react'

import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreatePlan,
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
  useGetTeacherCourses,
} from '../api'
import { CommitmentsEditor, type DraftItem } from '../components/CommitmentsEditor'
import { IndicatorPicker, type IndicatorSelection } from '../components/IndicatorPicker'
import { indicatorKey } from '../lib/planStatus'
import type { PlanCourseInput } from '../types'

let draftSeq = 0

function nextKey() {
  draftSeq += 1
  return `draft-${draftSeq}`
}

/**
 * Creation flow of an improvement plan.
 *
 * Route: `/planes/nuevo?teacher=<id>&period=<id>` — the teacher profile links
 * here with both preselected, so the director never has to search again.
 */
export default function CreatePlanPage() {
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()

  const presetTeacher = searchParams.get('teacher')
  const presetPeriod = searchParams.get('period')
  /** The teacher profile links with the period code it was showing. */
  const presetPeriodCode = searchParams.get('period_code')

  // Everything the user hasn't touched yet is derived, never synced through an
  // effect: the overrides below are `undefined`/`null` until they edit.
  const [periodOverride, setPeriodOverride] = useState<number | undefined>(
    presetPeriod ? Number(presetPeriod) : undefined,
  )
  const [teacherId, setTeacherId] = useState<number | undefined>(
    presetTeacher ? Number(presetTeacher) : undefined,
  )
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [programName, setProgramName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [coursesOverride, setCoursesOverride] = useState<PlanCourseInput[] | null>(null)

  const { data: periodsResponse } = useGetPlanPeriods()
  const periods = useMemo(() => periodsResponse?.data ?? [], [periodsResponse])

  const { data: indicatorsResponse } = useGetPlanIndicators()
  const indicators = indicatorsResponse?.data
  const aspects = useMemo(() => indicators?.aspects ?? [], [indicators])

  /** The period the caller came from, else the most recent evaluated one. */
  const periodId = useMemo(() => {
    if (periodOverride != null) return periodOverride
    if (periods.length === 0) return undefined

    const fromCode = presetPeriodCode
      ? periods.find((period) => period.code === presetPeriodCode)
      : undefined

    return fromCode?.id ?? periods[0].id
  }, [periodOverride, periods, presetPeriodCode])

  const { data: candidatesResponse, isPending: candidatesPending } =
    useGetPlanCandidates(periodId)
  const candidates = candidatesResponse?.data ?? []
  const threshold = indicators?.threshold ?? 3.5

  const candidate = candidates.find((entry) => entry.teacher_id === teacherId)

  const { data: coursesResponse } = useGetTeacherCourses(teacherId, periodId)

  const createPlan = useCreatePlan()

  /** Asignaturas prefilled from the teacher's groups in the period. */
  const prefilledCourses = useMemo<PlanCourseInput[]>(
    () =>
      (coursesResponse?.data ?? []).map((option, index) => ({
        academic_group_id: option.academic_group_id,
        course_name: option.course_name ?? '',
        course_code: option.course_code,
        group_name: option.group_name,
        order: index,
      })),
    [coursesResponse],
  )

  const courses = coursesOverride ?? prefilledCourses

  function updateCourses(
    next: PlanCourseInput[] | ((current: PlanCourseInput[]) => PlanCourseInput[]),
  ) {
    setCoursesOverride(typeof next === 'function' ? next(courses) : next)
  }

  const defaultTitle =
    candidate?.name && periodId
      ? `Plan de mejoramiento · ${candidate.name} · ${
          periods.find((entry) => entry.id === periodId)?.code ?? ''
        }`.trim()
      : ''

  const title = titleOverride ?? defaultTitle

  const aspectByDimension = useMemo(
    () =>
      Object.fromEntries(
        aspects
          .filter((aspect) => aspect.dimension)
          .map((aspect) => [aspect.dimension as string, aspect.aspect]),
      ),
    [aspects],
  )

  const selectedKeys = useMemo(
    () => new Set(items.map((item) => indicatorKey(item.target_type, item.target_ref))),
    [items],
  )

  function addIndicator(selection: IndicatorSelection) {
    setItems((current) => [
      ...current,
      {
        key: nextKey(),
        description: `${selection.label}${
          selection.average != null ? ` (${selection.average.toFixed(2)})` : ''
        }`,
        commitment: '',
        aspect: selection.aspect,
        target_type: selection.target_type as DraftItem['target_type'],
        target_ref: selection.target_ref,
        baseline_value: selection.average,
        target_value: threshold,
        suggestions: selection.suggestions,
        comment_ids: [],
      },
    ])
  }

  function addQualitative(aspect: number) {
    setItems((current) => [
      ...current,
      {
        key: nextKey(),
        description: '',
        commitment: '',
        aspect,
        target_type: 'QUALITATIVE',
        target_ref: null,
        baseline_value: null,
        target_value: null,
        suggestions: [],
        comment_ids: [],
      },
    ])
  }

  function patchItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    )
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  const canSubmit =
    teacherId != null &&
    periodId != null &&
    title.trim().length > 0 &&
    items.length > 0 &&
    items.every((item) => item.description.trim().length > 0)

  function submit() {
    if (!canSubmit) return

    createPlan.mutate(
      {
        teacher_id: teacherId,
        origin_period_id: periodId,
        title: title.trim(),
        description: description.trim() || undefined,
        program_name: programName.trim() || undefined,
        start_date: startDate || undefined,
        items: items.map((item, index) => ({
          description: item.description.trim(),
          commitment: item.commitment.trim() || null,
          aspect: item.aspect,
          target_type: item.target_type,
          target_ref: item.target_ref,
          baseline_value: item.baseline_value,
          target_value: item.target_value,
          order: index,
          comment_ids: item.comment_ids,
        })),
        courses: courses.filter((course) => course.course_name.trim().length > 0),
      },
      {
        onSuccess: (response) => {
          const plan = response.data
          if (plan) navigate(`/planes/${plan.id}`)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageTitle>Nuevo plan de mejoramiento</PageTitle>

      <section className="border-border bg-background space-y-4 rounded-md border p-6">
        <h2 className="font-semibold">1. Docente y periodo</h2>

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="period">Periodo de origen</Label>
            <Select
              value={periodId ?? null}
              onValueChange={(value) => {
                setPeriodOverride(value as number)
                setTeacherId(undefined)
                setItems([])
                setCoursesOverride(null)
              }}
            >
              <SelectTrigger id="period" className="w-40">
                <SelectValue placeholder="Periodo">
                  {periods.find((period) => period.id === periodId)?.code}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-64 flex-1 space-y-1.5">
            <Label htmlFor="teacher">Docente</Label>
            <Select
              value={teacherId ?? null}
              onValueChange={(value) => {
                setTeacherId(value as number)
                setItems([])
                setCoursesOverride(null)
              }}
              disabled={candidatesPending}
            >
              <SelectTrigger id="teacher" className="w-full">
                <SelectValue placeholder="Selecciona un docente…">
                  {candidate?.name}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {candidates.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-1.5 text-sm">
                    Sin docentes evaluados en este periodo.
                  </p>
                ) : (
                  candidates.map((entry) => (
                    <SelectItem
                      key={entry.teacher_id}
                      value={entry.teacher_id}
                      disabled={entry.has_plan}
                    >
                      {entry.name}
                      <span className="text-muted-foreground num">
                        · {entry.overall_average.toFixed(2)}
                        {entry.has_plan ? ' (ya tiene plan)' : ''}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {candidate && (
          <div className="border-border flex flex-wrap items-center gap-3 rounded-md border p-3">
            <Avatar>
              <AvatarImage src={candidate.avatar_url ?? undefined} />
              <AvatarFallback>{candidate.name?.slice(0, 2) ?? '??'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{candidate.name}</p>
              <p className="text-muted-foreground text-xs">{candidate.institutional_code}</p>
            </div>
            <ScoreBadge value={candidate.overall_average} showMax />
            {candidate.below_threshold && (
              <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                Bajo el umbral
              </Badge>
            )}
          </div>
        )}
      </section>

      {candidate && (
        <section className="border-border bg-background space-y-4 rounded-md border p-6">
          <div>
            <h2 className="font-semibold">2. Indicadores</h2>
            <p className="text-muted-foreground text-sm">
              Se listan todos los indicadores; los que están por debajo del umbral aparecen
              resaltados. Tú decides cuáles justifican el plan.
            </p>
          </div>

          <IndicatorPicker
            candidate={candidate}
            threshold={threshold}
            selectedKeys={selectedKeys}
            onSelect={addIndicator}
            aspectByDimension={aspectByDimension}
          />
        </section>
      )}

      {items.length > 0 && (
        <section className="border-border bg-background space-y-4 rounded-md border p-6">
          <div>
            <h2 className="font-semibold">3. Compromisos</h2>
            <p className="text-muted-foreground text-sm">
              Agrupados por los cinco aspectos de los formatos oficiales.
            </p>
          </div>

          <CommitmentsEditor
            items={items}
            aspects={aspects}
            onChange={patchItem}
            onRemove={removeItem}
            onAddQualitative={addQualitative}
          />
        </section>
      )}

      {teacherId != null && (
        <section className="border-border bg-background space-y-4 rounded-md border p-6">
          <div>
            <h2 className="font-semibold">4. Asignaturas</h2>
            <p className="text-muted-foreground text-sm">
              Se prellenan con los grupos del docente en el periodo; puedes ajustarlas.
            </p>
          </div>

          <ul className="space-y-2">
            {courses.map((course, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-56 flex-1"
                  value={course.course_name}
                  onChange={(event) =>
                    updateCourses((current) =>
                      current.map((entry, position) =>
                        position === index
                          ? { ...entry, course_name: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Asignatura"
                />
                <Input
                  className="w-32"
                  value={course.course_code ?? ''}
                  onChange={(event) =>
                    updateCourses((current) =>
                      current.map((entry, position) =>
                        position === index
                          ? { ...entry, course_code: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Código"
                />
                <Input
                  className="w-24"
                  value={course.group_name ?? ''}
                  onChange={(event) =>
                    updateCourses((current) =>
                      current.map((entry, position) =>
                        position === index
                          ? { ...entry, group_name: event.target.value }
                          : entry,
                      ),
                    )
                  }
                  placeholder="Grupo"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateCourses((current) => current.filter((_, position) => position !== index))
                  }
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateCourses((current) => [...current, { course_name: '', order: current.length }])
            }
          >
            Añadir asignatura
          </Button>
        </section>
      )}

      <section className="border-border bg-background space-y-4 rounded-md border p-6">
        <h2 className="font-semibold">5. Datos del plan</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(event) => setTitleOverride(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plan-desc">Descripción</Label>
          <Textarea
            id="plan-desc"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="program">Programa académico</Label>
            <Input
              id="program"
              value={programName}
              onChange={(event) => setProgramName(event.target.value)}
              placeholder="Ej. Ingeniería de Sistemas"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start">Fecha de inicio</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate('/planes')}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={!canSubmit || createPlan.isPending}>
          <Save className="size-4" aria-hidden="true" />
          {createPlan.isPending ? 'Creando…' : 'Crear plan'}
        </Button>
      </div>
    </div>
  )
}
