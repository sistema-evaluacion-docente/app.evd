import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { Layers, Save } from 'lucide-react'

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
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
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
  pruneCourses,
  subjectOfComment,
  type IndicatorPick,
} from '../lib/planDraft'
import type { DraftCourse, DraftItem, PlanSubjectOption } from '../types'

/** Sentinel of the "añadir asignatura" select: an empty row to type by hand. */
const MANUAL_COURSE = 'MANUAL'

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
  const [facultyOverride, setFacultyOverride] = useState<string | null>(null)
  const [departmentOverride, setDepartmentOverride] = useState<string | null>(null)
  /** The plan starts the day it is drawn up unless the director says otherwise. */
  const [startDate, setStartDate] = useState(todayISO)
  // The acto administrativo comes from the Consejo de Departamento session that
  // approves the plan, so it is known by the time the plan is written down —
  // and the acta can't be closed without it.
  const [actaNumber, setActaNumber] = useState('')
  const [actaDate, setActaDate] = useState('')
  const [councilObservations, setCouncilObservations] = useState('')
  const [departmentObservations, setDepartmentObservations] = useState('')
  const [programObservations, setProgramObservations] = useState('')

  const [onlyWeak, setOnlyWeak] = useState(true)
  const [subjectKey, setSubjectKey] = useState(SUBJECT_ALL)
  const [items, setItems] = useState<DraftItem[]>([])
  const [courses, setCourses] = useState<DraftCourse[]>([])

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

  const period = periods.find((entry) => entry.id === periodId)

  // `isLoading` and not `isPending`: the query is disabled until there is a
  // period, and a disabled query is pending forever — which would leave the
  // teacher select dead with no explanation.
  const { data: candidatesResponse, isLoading: candidatesLoading } = useGetPlanCandidates(periodId)
  const candidates = candidatesResponse?.data ?? []
  const threshold = indicators?.threshold ?? 3.5

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

  const defaultTitle =
    candidate?.name && periodId
      ? `Plan de mejoramiento · ${candidate.name} · ${period?.code ?? ''}`.trim()
      : ''

  const title = titleOverride ?? defaultTitle

  // The director's own department names the program the plan belongs to: at
  // UFPS a department is named after the program it serves, so the "PROGRAMA
  // ACADÉMICO" column of the forms is filled from it instead of asked twice.
  const authDepartment = useAuthStore((state) => state.user?.department_name) ?? ''
  const departmentName = departmentOverride ?? authDepartment
  const facultyName = facultyOverride ?? facultyOfProgram(authDepartment)?.name ?? ''
  const programName = departmentName

  const departmentOptions = useMemo(
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

  const selectedIds = useMemo(() => new Set(items.map((item) => item.selection_id)), [items])

  function resetPicking() {
    setItems([])
    setCourses([])
    setSubjectKey(SUBJECT_ALL)
  }

  function toggleIndicator(pick: IndicatorPick) {
    const subject = workbench.activeSubject
    const id = indicatorSelectionId(subject?.key ?? null, pick.target_type, pick.target_ref)

    if (selectedIds.has(id)) {
      const next = items.filter((item) => item.selection_id !== id)

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

    if (selectedIds.has(id)) {
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
    teacherId == null && 'Selecciona un docente.',
    periodId == null && 'Selecciona un periodo.',
    title.trim().length === 0 && 'El plan necesita un título.',
    items.length === 0 && 'Agrega al menos un indicador, comentario o compromiso.',
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

  function submit() {
    if (!canSubmit || teacherId == null || periodId == null) return

    createPlan.mutate(
      {
        teacher_id: teacherId,
        origin_period_id: periodId,
        title: title.trim(),
        description: description.trim() || undefined,
        program_name: programName.trim() || undefined,
        faculty_name: facultyName.trim() || undefined,
        department_name: departmentName.trim() || undefined,
        start_date: startDate || undefined,
        acta_number: actaNumber.trim() || undefined,
        acta_date: actaDate || undefined,
        council_observations: councilObservations.trim() || undefined,
        department_director_observations: departmentObservations.trim() || undefined,
        program_director_observations: programObservations.trim() || undefined,
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
        courses: courses
          .filter((course) => course.course_name.trim().length > 0)
          .map((course, index) => ({
            academic_group_id: course.academic_group_id,
            course_name: course.course_name.trim(),
            course_code: course.course_code,
            group_name: course.group_name,
            program_name: programName.trim() || undefined,
            order: index,
          })),
      },
      {
        onSuccess: (response) => {
          const plan = response.data
          if (plan) navigate(`/planes/${plan.id}`)
        },
      },
    )
  }

  // Guards go last on purpose: every hook of the component runs above them.
  if (periodsLoading || indicatorsLoading) {
    return (
      <div>
        <PageTitle>Nuevo plan de mejoramiento</PageTitle>
        <CreatePlanSkeleton withTeacher={presetTeacher != null} />
      </div>
    )
  }

  if (periodsFailed || indicatorsFailed) {
    return (
      <div className="space-y-6">
        <PageTitle>Nuevo plan de mejoramiento</PageTitle>
        <InlineError message="No fue posible cargar los periodos ni los aspectos del formato. Recarga la página para intentarlo de nuevo." />
      </div>
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

      {candidate && (
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

            {workbench.allSubjects.length > 0 && (
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
                  />
                  <Input
                    className="w-32"
                    value={course.course_code ?? ''}
                    onChange={(event) =>
                      patchCourse(course.key, { course_code: event.target.value })
                    }
                    placeholder="Código"
                  />
                  <Input
                    className="w-24"
                    value={course.group_name ?? ''}
                    onChange={(event) =>
                      patchCourse(course.key, { group_name: event.target.value })
                    }
                    placeholder="Grupo"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
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
            <Combobox
              id="department"
              value={departmentName}
              onValueChange={setDepartmentOverride}
              options={departmentOptions}
              placeholder="Departamento"
            />
            <p className="text-muted-foreground text-xs">
              También es el programa académico que se imprime en los formatos.
            </p>
          </div>

          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="start">Fecha de inicio</Label>
            <DatePicker id="start" value={startDate} onChange={setStartDate} />
          </div>
        </div>

        {/* "ACTO ADMINISTRATIVO: ACTA No. ___ FECHA: ___" — the foot of the
            Ficha de acuerdo. It comes from the Consejo de Departamento session
            that approves the plan, and the acta can't be closed without it. */}
        <div className="flex flex-wrap gap-4 border-t pt-4">
          <div className="min-w-40 space-y-1.5">
            <Label htmlFor="acta-number">Acta N.º</Label>
            <Input
              id="acta-number"
              value={actaNumber}
              onChange={(event) => setActaNumber(event.target.value)}
              placeholder="Ej. 012"
              className="num"
            />
          </div>

          <div className="min-w-56 space-y-1.5">
            <Label htmlFor="acta-date">Fecha del acta</Label>
            <DatePicker id="acta-date" value={actaDate} onChange={setActaDate} />
          </div>

          <p className="text-muted-foreground w-full text-xs">
            Del Consejo de Departamento que respalda el acuerdo. Se imprimen en la Ficha de acuerdo
            (Formato 2) y hacen falta para poder cerrar el acta.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pb-8">
        {blockers.length > 0 && (
          <p className="text-muted-foreground mr-auto text-xs">{blockers[0]}</p>
        )}

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
