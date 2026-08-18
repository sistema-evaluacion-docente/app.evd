import { useMemo, useState } from 'react'
import { useLocation, useRoute, useSearchParams } from 'wouter'
import { Layers, Save } from 'lucide-react'

import { BackButton } from '@/components/common/BackButton'
import { Combobox } from '@/components/common/Combobox'
import { DatePicker } from '@/components/common/DatePicker'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import {
  SelectLoadingLabel,
  selectLoadingTriggerClass,
} from '@/components/common/SelectLoadingLabel'
import CreatePlanSkeleton from '@/components/skeletons/CreatePlanSkeleton'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/features/auth'
import type { TeacherComment } from '@/features/teachers/types'
import { todayISO } from '@/lib/formatDate'
import { cn } from '@/lib/utils'
import {
  useCreatePlan,
  useGetPlan,
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
  useUpdatePlan,
} from '../api'
import { CommitmentsEditor } from '../components/CommitmentsEditor'
import { IndicatorPicker } from '../components/IndicatorPicker'
import {
  FACULTY_NAMES,
  facultyOfProgram,
  PROGRAM_NAMES,
  programsOfFaculty,
} from '../config/academicCatalog'
import { usePlanWorkbench } from '../hooks/usePlanWorkbench'
import { SUBJECT_ALL } from '../lib/indicatorMatrix'
import {
  buildBlankDraft,
  buildCommentDraft,
  buildIndicatorDraft,
  commentSelectionId,
  courseOfSubject,
  courseRowKey,
  coursesOfSubject,
  indicatorSelectionId,
  mergeCourses,
  planCoursesToDrafts,
  planItemsToDrafts,
  pruneCourses,
  subjectOfComment,
  type IndicatorPick,
} from '../lib/planDraft'
import { indicatorKey } from '../lib/planStatus'
import type {
  DraftCourse,
  DraftItem,
  Plan,
  PlanIndicators,
  PlanPeriod,
  PlanSubjectOption,
} from '../types'

/** Sentinel of the "añadir asignatura" select: an empty row to type by hand. */
const MANUAL_COURSE = 'MANUAL'

type FormMode = 'create' | 'edit'

/**
 * Seed of every field the form owns. The `*Override` ones are `null` while the
 * value is still derived from context, which is how the creation flow starts and
 * how a plan that never recorded, say, a faculty comes back for editing.
 */
interface PlanFormInitial {
  periodId?: number
  teacherId?: number
  titleOverride: string | null
  description: string
  facultyOverride: string | null
  departmentOverride: string | null
  programOverride: string | null
  actaDate: string
  actaNumber: string
  councilObservations: string
  departmentObservations: string
  programObservations: string
  items: DraftItem[]
  courses: DraftCourse[]
}

/**
 * Creation and edition of an improvement plan, on the same form.
 *
 * Routes: `/planes/nuevo?teacher=<id>&period=<id>` — the teacher profile links
 * here with both preselected — and `/planes/:id/editar`, which brings the saved
 * plan back into the same workbench so the director can adjust what was agreed
 * after showing the Ficha de acuerdo to the teacher.
 *
 * The shell resolves the route and waits for the data; `PlanForm` below owns the
 * fields and is only mounted once every value it starts from is known, so the
 * form never syncs itself through an effect.
 */
export default function PlanFormPage() {
  const [isEditRoute, editParams] = useRoute('/planes/:id/editar')
  const mode: FormMode = isEditRoute ? 'edit' : 'create'
  const planId = editParams?.id ? Number(editParams.id) : undefined

  const [searchParams] = useSearchParams()
  const presetTeacher = searchParams.get('teacher')
  const presetPeriod = searchParams.get('period')
  /** The teacher profile links with the period code it was showing. */
  const presetPeriodCode = searchParams.get('period_code')

  // Periods and the indicator catalogue make up the shell of the form: the five
  // aspects, the threshold and the period list. The page waits for both instead
  // of painting a half-built form that fills itself in as the requests land.
  const {
    data: periodsResponse,
    isLoading: periodsLoading,
    isError: periodsFailed,
  } = useGetPlanPeriods()
  const periods = useMemo(() => periodsResponse?.data ?? [], [periodsResponse])

  const {
    data: indicatorsResponse,
    isLoading: indicatorsLoading,
    isError: indicatorsFailed,
  } = useGetPlanIndicators()
  const indicators = indicatorsResponse?.data

  const {
    data: planResponse,
    isLoading: planLoading,
    isError: planFailed,
  } = useGetPlan(mode === 'edit' ? planId : undefined)
  const plan = planResponse?.data

  const title = mode === 'edit' ? 'Editar plan de mejoramiento' : 'Nuevo plan de mejoramiento'

  if (periodsLoading || indicatorsLoading || (mode === 'edit' && planLoading)) {
    return (
      <div>
        <PageTitle>{title}</PageTitle>
        <CreatePlanSkeleton withTeacher={mode === 'edit' || presetTeacher != null} />
      </div>
    )
  }

  if (periodsFailed || indicatorsFailed || !indicators) {
    return (
      <div className="space-y-6">
        <PageTitle>{title}</PageTitle>
        <InlineError message="No fue posible cargar los periodos ni los aspectos del formato. Recarga la página para intentarlo de nuevo." />
      </div>
    )
  }

  if (mode === 'edit' && (planFailed || !plan)) {
    return (
      <div className="space-y-6">
        <PageTitle>{title}</PageTitle>
        <InlineError message="No fue posible cargar el plan que quieres editar." />
      </div>
    )
  }

  const initial: PlanFormInitial =
    plan && mode === 'edit'
      ? {
          periodId: plan.origin_period_id,
          teacherId: plan.teacher_id,
          titleOverride: plan.title,
          description: plan.description ?? '',
          facultyOverride: plan.faculty_name,
          departmentOverride: plan.department_name,
          programOverride: plan.program_name,
          actaDate: plan.acta_date ?? plan.start_date ?? '',
          actaNumber: plan.acta_number ?? '',
          councilObservations: plan.council_observations ?? '',
          departmentObservations: plan.department_director_observations ?? '',
          programObservations: plan.program_director_observations ?? '',
          items: planItemsToDrafts(plan.items, indicators),
          courses: planCoursesToDrafts(plan.courses),
        }
      : {
          periodId: presetPeriod ? Number(presetPeriod) : undefined,
          teacherId: presetTeacher ? Number(presetTeacher) : undefined,
          titleOverride: null,
          description: '',
          facultyOverride: null,
          departmentOverride: null,
          programOverride: null,
          // The plan is drawn up the day the Consejo de Departamento approves it.
          actaDate: todayISO(),
          actaNumber: '',
          councilObservations: '',
          departmentObservations: '',
          programObservations: '',
          items: [],
          courses: [],
        }

  return (
    <PlanForm
      mode={mode}
      plan={plan}
      initial={initial}
      periods={periods}
      indicators={indicators}
      presetPeriodCode={presetPeriodCode}
    />
  )
}

function PlanForm({
  mode,
  plan,
  initial,
  periods,
  indicators,
  presetPeriodCode,
}: {
  mode: FormMode
  plan?: Plan
  initial: PlanFormInitial
  periods: PlanPeriod[]
  indicators: PlanIndicators
  presetPeriodCode: string | null
}) {
  const [, navigate] = useLocation()

  const isEdit = mode === 'edit'
  // Once the acta is signed the API refuses its content — commitments, courses,
  // acta number/date and the council's observations. The rest of the plan keeps
  // being editable so it can go on being tracked.
  const actaLocked = Boolean(plan?.acta_locked)

  // Everything the user hasn't touched yet is derived, never synced through an
  // effect: the overrides below hold whatever the form started from.
  const [periodOverride, setPeriodOverride] = useState<number | undefined>(initial.periodId)
  const [teacherId, setTeacherId] = useState<number | undefined>(initial.teacherId)
  const [titleOverride, setTitleOverride] = useState<string | null>(initial.titleOverride)
  const [description, setDescription] = useState(initial.description)
  const [facultyOverride, setFacultyOverride] = useState<string | null>(initial.facultyOverride)
  const [departmentOverride, setDepartmentOverride] = useState<string | null>(
    initial.departmentOverride,
  )
  const [programOverride, setProgramOverride] = useState<string | null>(initial.programOverride)
  // One date for both: the agreement starts the day the acta backing it is
  // signed. Formato 2 prints it as "FECHA" and Formato 3 as "Fecha".
  const [actaDate, setActaDate] = useState(initial.actaDate)
  const [actaNumber, setActaNumber] = useState(initial.actaNumber)
  const [councilObservations, setCouncilObservations] = useState(initial.councilObservations)
  const [departmentObservations, setDepartmentObservations] = useState(
    initial.departmentObservations,
  )
  const [programObservations, setProgramObservations] = useState(initial.programObservations)

  const [onlyWeak, setOnlyWeak] = useState(true)
  const [subjectKey, setSubjectKey] = useState(SUBJECT_ALL)
  const [items, setItems] = useState<DraftItem[]>(initial.items)
  const [courses, setCourses] = useState<DraftCourse[]>(initial.courses)

  const aspects = useMemo(() => indicators.aspects ?? [], [indicators])

  /** The period the caller came from, else the most recent evaluated one. */
  const periodId = useMemo(() => {
    if (periodOverride != null) return periodOverride
    if (periods.length === 0) return undefined

    const fromCode = presetPeriodCode
      ? periods.find((period) => period.code === presetPeriodCode)
      : undefined

    return fromCode?.id ?? periods[0].id
  }, [periodOverride, periods, presetPeriodCode])

  const period = periods.find((entry) => entry.id === periodId)

  // `isLoading` and not `isPending`: the query is disabled until there is a
  // period, and a disabled query is pending forever — which would leave the
  // teacher select dead with no explanation.
  const { data: candidatesResponse, isLoading: candidatesLoading } = useGetPlanCandidates(periodId)
  const candidates = candidatesResponse?.data ?? []
  const threshold = indicators.threshold ?? 3.5

  const candidate = candidates.find((entry) => entry.teacher_id === teacherId)

  const workbench = usePlanWorkbench({
    teacherId,
    periodId,
    periodName: period?.name ?? period?.code,
    candidate,
    catalogue: indicators,
    threshold,
    onlyWeak,
    subjectKey,
  })

  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan(plan?.id ?? 0)
  const submission = isEdit ? updatePlan : createPlan

  const teacherName = candidate?.name ?? plan?.teacher_name ?? null

  const defaultTitle =
    teacherName && periodId
      ? `Plan de mejoramiento · ${teacherName} · ${period?.code ?? ''}`.trim()
      : ''

  const title = titleOverride ?? defaultTitle

  // At UFPS the director's own "department" is named after the programme it
  // serves, so it seeds PROGRAMA ACADÉMICO. The academic department proper has
  // no catalogue yet: it is typed by hand and left blank until there is one, in
  // which case the API falls back to the teacher's own department.
  const authDepartment = useAuthStore((state) => state.user?.department_name) ?? ''
  const programName = programOverride ?? authDepartment
  const departmentName = departmentOverride ?? ''
  const facultyName = facultyOverride ?? facultyOfProgram(programName)?.name ?? ''

  const programOptions = useMemo(
    () => (facultyName ? programsOfFaculty(facultyName) : PROGRAM_NAMES),
    [facultyName],
  )

  const aspectByDimension = useMemo(
    () =>
      Object.fromEntries(
        aspects
          .filter((aspect) => aspect.dimension)
          .map((aspect) => [aspect.dimension as string, aspect.aspect]),
      ),
    [aspects],
  )

  /**
   * How a drafted commitment answers to the picker.
   *
   * While creating, the same indicator picked under two subjects is two
   * different commitments. A saved plan doesn't record which subject each one
   * came from, so when editing the indicator alone is the identity — one
   * commitment per indicator, which is what the official form prints anyway.
   * Without this an already-agreed indicator would show up unpicked and
   * clicking it would file a duplicate.
   */
  const pickerScope = workbench.effectiveSubjectKey === SUBJECT_ALL
    ? null
    : workbench.effectiveSubjectKey

  const selectedIds = useMemo(
    () =>
      new Set(
        items.map((item) =>
          isEdit && item.target_ref != null
            ? indicatorSelectionId(pickerScope, item.target_type, item.target_ref)
            : item.selection_id,
        ),
      ),
    [items, isEdit, pickerScope],
  )

  /** Identity a drafted commitment is matched by when toggling it off. */
  function matchKeyOf(item: DraftItem): string {
    return isEdit && item.target_ref != null
      ? indicatorKey(item.target_type, item.target_ref)
      : item.selection_id
  }

  function resetPicking() {
    setItems([])
    setCourses([])
    setSubjectKey(SUBJECT_ALL)
  }

  function toggleIndicator(pick: IndicatorPick) {
    const subject = workbench.activeSubject
    const id = indicatorSelectionId(subject?.key ?? null, pick.target_type, pick.target_ref)
    const matchKey = isEdit ? indicatorKey(pick.target_type, pick.target_ref) : id

    if (items.some((item) => matchKeyOf(item) === matchKey)) {
      const next = items.filter((item) => matchKeyOf(item) !== matchKey)

      setItems(next)
      setCourses((current) => pruneCourses(current, next))
      return
    }

    setItems((current) => [...current, buildIndicatorDraft(pick, subject, threshold)])
    // Picked at teacher level, the commitment covers every asignatura he taught
    // — not only the ones the "solo indicadores bajos" filter left standing.
    setCourses((current) => mergeCourses(current, coursesOfSubject(subject, workbench.allSubjects)))
  }

  function toggleComment(comment: TeacherComment) {
    const id = commentSelectionId(comment.id)

    if (items.some((item) => item.selection_id === id)) {
      const next = items.filter((item) => item.selection_id !== id)

      setItems(next)
      setCourses((current) => pruneCourses(current, next))
      return
    }

    const subject = subjectOfComment(comment, workbench.allSubjects)

    setItems((current) => [...current, buildCommentDraft(comment, subject)])
    setCourses((current) => mergeCourses(current, coursesOfSubject(subject, [])))
  }

  function addQualitative(aspect: number) {
    setItems((current) => [...current, buildBlankDraft(aspect)])
  }

  function patchItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function removeItem(key: string) {
    const next = items.filter((item) => item.key !== key)

    setItems(next)
    setCourses((current) => pruneCourses(current, next))
  }

  function patchCourse(key: string, patch: Partial<DraftCourse>) {
    setCourses((current) =>
      current.map((course) =>
        course.key === key ? { ...course, ...patch, origin: 'manual' } : course,
      ),
    )
  }

  /**
   * Adds one of the asignaturas the teacher actually taught, code and group
   * included. Marked `manual` so the picking never takes it back out — the
   * director put it there on purpose.
   */
  function addSubjectCourse(subject: PlanSubjectOption) {
    const row = courseOfSubject(subject)

    setCourses((current) =>
      current.some((course) => course.key === courseRowKey(row))
        ? current
        : [...current, { ...row, key: courseRowKey(row), origin: 'manual', order: current.length }],
    )
  }

  /** An asignatura the app doesn't know about, typed from scratch. */
  function addBlankCourse() {
    setCourses((current) => [
      ...current,
      {
        key: `manual-${current.length}-${Date.now()}`,
        origin: 'manual',
        course_name: '',
        order: current.length,
      },
    ])
  }

  /** Subjects of the teacher that aren't already listed in the plan. */
  const addableSubjects = useMemo(() => {
    const listed = new Set(courses.map((course) => course.key))

    return workbench.allSubjects.filter(
      (subject) => !listed.has(courseRowKey(courseOfSubject(subject))),
    )
  }, [courses, workbench.allSubjects])

  const blockers = [
    !isEdit && teacherId == null && 'Selecciona un docente.',
    !isEdit && periodId == null && 'Selecciona un periodo.',
    title.trim().length === 0 && 'El plan necesita un título.',
    !actaLocked &&
      items.length === 0 &&
      'Agrega al menos un indicador, comentario o compromiso.',
    !actaLocked &&
      items.some((item) => item.description.trim().length === 0) &&
      'Hay compromisos sin descripción.',
  ].filter((entry): entry is string => Boolean(entry))

  const canSubmit = blockers.length === 0

  /** Where the teacher select stands, so the trigger can say it out loud. */
  const noPeriodYet = periodId == null
  const noCandidates = !candidatesLoading && !noPeriodYet && candidates.length === 0
  const teacherPlaceholder = noPeriodYet
    ? 'Selecciona un periodo primero'
    : noCandidates
      ? 'Sin docentes evaluados en este periodo'
      : 'Selecciona un docente…'

  function itemsPayload() {
    return items.map((item, index) => ({
      id: item.id,
      description: item.description.trim(),
      commitment: item.commitment.trim() || null,
      aspect: item.aspect,
      target_type: item.target_type,
      target_ref: item.target_ref,
      baseline_value: item.baseline_value,
      target_value: item.target_value,
      status: item.status,
      order: index,
      comment_ids: item.comment_ids,
    }))
  }

  function coursesPayload() {
    return courses
      .filter((course) => course.course_name.trim().length > 0)
      .map((course, index) => ({
        academic_group_id: course.academic_group_id,
        course_name: course.course_name.trim(),
        course_code: course.course_code,
        group_name: course.group_name,
        program_name: programName.trim() || undefined,
        order: index,
      }))
  }

  function submit() {
    if (!canSubmit) return

    const shared = {
      title: title.trim(),
      description: description.trim() || undefined,
      program_name: programName.trim() || undefined,
      faculty_name: facultyName.trim() || undefined,
      department_name: departmentName.trim() || undefined,
      department_director_observations: departmentObservations.trim() || undefined,
      program_director_observations: programObservations.trim() || undefined,
    }

    if (isEdit && plan) {
      // A locked acta rejects its own content: leave those keys out entirely
      // rather than send values the API will refuse the whole request over.
      updatePlan.mutate(
        {
          ...shared,
          ...(actaLocked
            ? {}
            : {
                start_date: actaDate || undefined,
                acta_date: actaDate || undefined,
                acta_number: actaNumber.trim() || undefined,
                council_observations: councilObservations.trim() || undefined,
                items: itemsPayload(),
                courses: coursesPayload(),
              }),
        },
        { onSuccess: () => navigate(`/planes/${plan.id}`) },
      )
      return
    }

    if (teacherId == null || periodId == null) return

    createPlan.mutate(
      {
        ...shared,
        teacher_id: teacherId,
        origin_period_id: periodId,
        start_date: actaDate || undefined,
        acta_date: actaDate || undefined,
        acta_number: actaNumber.trim() || undefined,
        council_observations: councilObservations.trim() || undefined,
        items: itemsPayload(),
        courses: coursesPayload(),
      },
      {
        onSuccess: (response) => {
          const created = response.data
          if (created) navigate(`/planes/${created.id}`)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {isEdit && plan && <BackButton href={`/planes/${plan.id}`} className="mb-2" />}

      <PageTitle>{isEdit ? 'Editar plan de mejoramiento' : 'Nuevo plan de mejoramiento'}</PageTitle>

      {actaLocked && (
        <InlineError message="El acuerdo está firmado: los compromisos, las asignaturas y los datos del acta ya no se pueden modificar. Para cambiarlos, elimina primero la Ficha de acuerdo firmada." />
      )}

      <section className="border-border bg-background space-y-4 rounded-md border p-6">
        <h2 className="font-semibold">1. Docente y periodo</h2>

        {isEdit ? (
          // Neither travels in the update payload: they are what the plan *is*.
          <div className="flex flex-wrap gap-x-10 gap-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Docente</span>{' '}
              <span className="font-semibold">{teacherName ?? '—'}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Periodo de origen</span>{' '}
              <span className="num font-semibold">
                {period?.code ?? plan?.origin_period_code ?? '—'}
              </span>
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="period">Periodo de origen</Label>
              <Select
                value={periodId ?? null}
                onValueChange={(value) => {
                  setPeriodOverride(value as number)
                  setTeacherId(undefined)
                  resetPicking()
                }}
              >
                <SelectTrigger id="period" className="w-40">
                  <SelectValue placeholder="Periodo">{period?.code}</SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {periods.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.code}
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
                  resetPicking()
                }}
                disabled={candidatesLoading || noPeriodYet || noCandidates}
              >
                <SelectTrigger
                  id="teacher"
                  aria-busy={candidatesLoading}
                  className={cn('w-full', candidatesLoading && selectLoadingTriggerClass)}
                >
                  {candidatesLoading ? (
                    <SelectLoadingLabel>Cargando docentes…</SelectLoadingLabel>
                  ) : (
                    <SelectValue placeholder={teacherPlaceholder}>{candidate?.name}</SelectValue>
                  )}
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
        )}

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

      {/* Arriving from the teacher profile the candidate is only known once the
          list lands; the space is held so the section doesn't shove the rest of
          the page down when it appears. */}
      {teacherId != null && !candidate && candidatesLoading && (
        <section
          className="border-border bg-background space-y-4 rounded-md border p-6"
          role="status"
          aria-busy="true"
        >
          <span className="sr-only">Cargando los indicadores del docente…</span>

          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-3.5 w-full max-w-2xl" />
          <Skeleton className="h-40 w-full" />
        </section>
      )}

      {candidate && !actaLocked && (
        <section className="border-border bg-background space-y-4 rounded-md border p-6">
          <div>
            <h2 className="font-semibold">2. Indicadores y comentarios</h2>
            <p className="text-muted-foreground text-sm">
              Se listan todos los indicadores del docente y los comentarios de sus estudiantes,
              agrupados por la dimensión de la que hablan. Filtra por asignatura para que el plan
              diga en qué materia se detectó cada cosa.
            </p>
          </div>

          <IndicatorPicker
            dimensions={workbench.dimensions}
            threshold={threshold}
            comments={workbench.comments}
            selectedIds={selectedIds}
            onToggleIndicator={toggleIndicator}
            onToggleComment={toggleComment}
            aspectByDimension={aspectByDimension}
            onlyWeak={onlyWeak}
            onOnlyWeakChange={setOnlyWeak}
            subjectOptions={workbench.subjectOptions}
            subjectKey={workbench.effectiveSubjectKey}
            onSubjectChange={setSubjectKey}
            isLoading={workbench.isLoading}
            weakCount={workbench.weakCount}
            riskyCount={workbench.riskyCount}
            aiStatus={workbench.aiStatus}
          />
        </section>
      )}

      <section className="border-border bg-background space-y-4 rounded-md border p-6">
        <div>
          <h2 className="font-semibold">3. Compromisos</h2>
          <p className="text-muted-foreground text-sm">
            Agrupados por los cinco aspectos de los formatos oficiales. Puedes añadir compromisos a
            mano aunque no hayas marcado ningún indicador.
          </p>
        </div>

        <CommitmentsEditor
          items={items}
          aspects={aspects}
          onChange={patchItem}
          onRemove={removeItem}
          onAddQualitative={addQualitative}
          disabled={actaLocked}
        />

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="council-obs">Observaciones del Consejo de Departamento</Label>
            <Textarea
              id="council-obs"
              rows={3}
              value={councilObservations}
              onChange={(event) => setCouncilObservations(event.target.value)}
              placeholder="Se imprimen en el Formato 2, bajo los compromisos acordados"
              disabled={actaLocked}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label htmlFor="department-obs">Observaciones del director de departamento</Label>
              <Textarea
                id="department-obs"
                rows={2}
                value={departmentObservations}
                onChange={(event) => setDepartmentObservations(event.target.value)}
              />
            </div>

            <div className="min-w-64 flex-1 space-y-1.5">
              <Label htmlFor="program-obs">Observaciones del director de programa</Label>
              <Textarea
                id="program-obs"
                rows={2}
                value={programObservations}
                onChange={(event) => setProgramObservations(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {teacherId != null && (
        <section className="border-border bg-background space-y-4 rounded-md border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">4. Asignaturas</h2>
              <p className="text-muted-foreground text-sm">
                Se van agregando solas con lo que marcas arriba: en «General» entran todas las del
                docente; con una asignatura filtrada, sólo esa. También puedes añadir cualquier otra
                que haya dictado y corregir su nombre.
              </p>
            </div>

            {workbench.allSubjects.length > 0 && !actaLocked && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCourses((current) =>
                      mergeCourses(current, coursesOfSubject(null, workbench.allSubjects)),
                    )
                  }
                >
                  <Layers className="size-4" aria-hidden="true" />
                  Añadir todas las del docente
                </Button>
                <Select
                  value={null}
                  onValueChange={(value) => {
                    if (value === MANUAL_COURSE) {
                      addBlankCourse()
                      return
                    }
                    const subject = addableSubjects.find((option) => option.key === value)

                    if (subject) addSubjectCourse(subject)
                  }}
                  disabled={workbench.isLoading}
                >
                  <SelectTrigger
                    aria-label="Añadir asignatura"
                    aria-busy={workbench.isLoading}
                    className={cn('w-80', workbench.isLoading && selectLoadingTriggerClass)}
                  >
                    {workbench.isLoading ? (
                      <SelectLoadingLabel>Cargando asignaturas…</SelectLoadingLabel>
                    ) : (
                      <SelectValue placeholder="Añadir asignatura…" />
                    )}
                  </SelectTrigger>

                  <SelectContent>
                    {addableSubjects.length === 0 ? (
                      <p className="text-muted-foreground px-2 py-1.5 text-sm">
                        {workbench.allSubjects.length === 0
                          ? 'Sin asignaturas registradas para este docente.'
                          : 'Ya están todas las asignaturas del docente.'}
                      </p>
                    ) : (
                      addableSubjects.map((subject) => (
                        <SelectItem key={subject.key} value={subject.key}>
                          {subject.label}
                        </SelectItem>
                      ))
                    )}

                    <SelectItem value={MANUAL_COURSE}>Otra asignatura…</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <p className="text-muted-foreground px-3 py-4 text-sm">
                Todavía no hay asignaturas: marca un indicador o un comentario y aparecerán aquí, o
                añádelas con el selector de abajo.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course.key} className="flex flex-wrap items-center gap-2">
                  <Input
                    className="min-w-56 flex-1"
                    value={course.course_name}
                    onChange={(event) =>
                      patchCourse(course.key, { course_name: event.target.value })
                    }
                    placeholder="Asignatura"
                    disabled={actaLocked}
                  />
                  <Input
                    className="w-32"
                    value={course.course_code ?? ''}
                    onChange={(event) =>
                      patchCourse(course.key, { course_code: event.target.value })
                    }
                    placeholder="Código"
                    disabled={actaLocked}
                  />
                  <Input
                    className="w-24"
                    value={course.group_name ?? ''}
                    onChange={(event) =>
                      patchCourse(course.key, { group_name: event.target.value })
                    }
                    placeholder="Grupo"
                    disabled={actaLocked}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actaLocked}
                    onClick={() =>
                      setCourses((current) => current.filter((entry) => entry.key !== course.key))
                    }
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="border-border bg-background space-y-4 rounded-md border p-6">
        <h2 className="font-semibold">5. Datos del plan</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitleOverride(event.target.value)}
          />
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

        {/* The three columns the official forms print in their header. They are
            free text on the API, so anything off-catalogue can still be typed. */}
        <div className="flex flex-wrap gap-4">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="faculty">Facultad</Label>
            <Combobox
              id="faculty"
              value={facultyName}
              onValueChange={setFacultyOverride}
              options={FACULTY_NAMES}
              placeholder="Facultad"
            />
          </div>

          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="department">Departamento académico</Label>
            <Input
              id="department"
              value={departmentName}
              onChange={(event) => setDepartmentOverride(event.target.value)}
              placeholder="Escríbelo"
            />
            <p className="text-muted-foreground text-xs">
              Si lo dejas vacío se imprime el departamento registrado del docente.
            </p>
          </div>

          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="program">Programa académico</Label>
            <Combobox
              id="program"
              value={programName}
              onValueChange={setProgramOverride}
              options={programOptions}
              placeholder="Programa"
            />
          </div>
        </div>

        {/* "ACTO ADMINISTRATIVO: ACTA No. ___ FECHA: ___" — the foot of the
            Ficha de acuerdo. It comes from the Consejo de Departamento session
            that approves the plan. */}
        <div className="flex flex-wrap gap-4 border-t pt-4">
          <div className="min-w-40 space-y-1.5">
            <Label htmlFor="acta-number">Acta N.º</Label>
            <Input
              id="acta-number"
              value={actaNumber}
              onChange={(event) => setActaNumber(event.target.value)}
              placeholder="Ej. 012"
              className="num"
              disabled={actaLocked}
            />
          </div>

          <div className="min-w-56 space-y-1.5">
            <Label htmlFor="acta-date">Fecha del acta</Label>
            <DatePicker
              id="acta-date"
              value={actaDate}
              onChange={setActaDate}
              disabled={actaLocked}
            />
          </div>

          <p className="text-muted-foreground w-full text-xs">
            Del Consejo de Departamento que respalda el acuerdo. Es también la fecha de inicio del
            plan: se imprime en la Ficha de acuerdo (Formato 2) y en el Plan de seguimiento
            (Formato 3), y hace falta para poder firmar el acta.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pb-8">
        {blockers.length > 0 && (
          <p className="text-muted-foreground mr-auto text-xs">{blockers[0]}</p>
        )}

        <Button
          variant="outline"
          onClick={() => navigate(isEdit && plan ? `/planes/${plan.id}` : '/planes')}
        >
          Cancelar
        </Button>
        <Button onClick={submit} disabled={!canSubmit || submission.isPending}>
          <Save className="size-4" aria-hidden="true" />
          {submission.isPending
            ? isEdit
              ? 'Guardando…'
              : 'Creando…'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear plan'}
        </Button>
      </div>
    </div>
  )
}
