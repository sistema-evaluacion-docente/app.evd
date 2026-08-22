import { type SubmitEvent, useMemo, useState } from 'react'
import { useLocation, useRoute, useSearchParams } from 'wouter'
import { toast } from 'sonner'
import { AlertTriangle, Cloud, Layers, Plus, RotateCcw, Save, X } from 'lucide-react'

import { Combobox } from '@/components/common/Combobox'
import { DatePicker } from '@/components/common/DatePicker'
import { FieldError } from '@/components/common/FieldError'
import { InlineError } from '@/components/common/InlineError'
import { PageTitle } from '@/components/common/PageTitle'
import { Required } from '@/components/common/Required'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { SearchSelect } from '@/components/common/SearchSelect'
import {
  SelectLoadingLabel,
  selectLoadingTriggerClass,
} from '@/components/common/SelectLoadingLabel'
import CreatePlanSkeleton from '@/components/skeletons/CreatePlanSkeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/features/auth'
import type { TeacherComment } from '@/features/teachers/types'
import formatDate, { todayISO } from '@/lib/formatDate'
import { fieldErrorId } from '@/lib/fieldErrorId'
import { cn } from '@/lib/utils'
import {
  useCreatePlan,
  useGetPlan,
  useGetPlanCandidates,
  useGetPlanIndicators,
  useGetPlanPeriods,
  useUpdatePlan,
  useUploadPlanDocument,
} from '../api'
import { PlanCaseReportUpload } from '../components/PlanCaseReportUpload'
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
import { usePlanFormDraft } from '../hooks/usePlanFormDraft'
import {
  clearPlanDraft,
  type PlanFormDraft,
  planDraftKey,
  readPlanDraft,
} from '../lib/planFormStorage'
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
  reserveDraftKeys,
  subjectOfComment,
  type IndicatorPick,
} from '../lib/planDraft'
import { countCompleteCommitments, indicatorKey } from '../lib/planStatus'
import { isPlanSuggested, planSuggestionReason } from '../lib/planSuggestion'
import {
  COMMITMENTS_ANCHOR_ID,
  COURSES_ANCHOR_ID,
  focusField,
  planFormErrors,
} from '../lib/planValidation'
import type {
  DraftCourse,
  DraftItem,
  Plan,
  PlanCandidate,
  PlanIndicators,
  PlanPeriod,
  PlanSubjectOption,
} from '../types'

/** Sentinel of the "añadir asignatura" select: takes every one of them at once. */
const ALL_COURSES = 'ALL'

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

  const draftKey = planDraftKey(mode === 'edit' ? planId : undefined)

  // Read once, on mount, and above the early returns below — a hook that only
  // runs on some renders is no hook at all. This is a starting value, not
  // something that follows the form: `PlanForm` owns every field from here on.
  const [restored, setRestored] = useState(() =>
    readPlanDraft(draftKey, {
      presetTeacherId: presetTeacher ? Number(presetTeacher) : undefined,
    }),
  )

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

  const seeded: PlanFormInitial = restored ? { ...initial, ...restoredFields(restored) } : initial

  // The key counter starts over on every load; without this a commitment added
  // after restoring would be handed a key a restored one already holds.
  if (restored) reserveDraftKeys([...seeded.items, ...seeded.courses])

  return (
    <PlanForm
      // Discarding rebuilds the form from `initial`, which is what dropping the
      // draft means — the remount is the point, not a side effect.
      key={restored ? 'restored' : 'clean'}
      mode={mode}
      plan={plan}
      initial={seeded}
      periods={periods}
      indicators={indicators}
      presetPeriodCode={presetPeriodCode}
      draftKey={draftKey}
      restoredAt={restored?.savedAt ?? null}
      onDiscardDraft={() => {
        clearPlanDraft(draftKey)
        setRestored(null)
      }}
    />
  )
}

/**
 * One teacher in the picker of section 1: the name, the average, and the flag
 * for the ones whose results already justify a plan.
 */
function CandidateOption({ candidate }: { candidate: PlanCandidate }) {
  // A teacher who already has one is past the suggestion.
  const suggested = !candidate.has_plan && isPlanSuggested(candidate)

  return (
    <>
      {suggested && (
        <>
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500" aria-hidden="true" />
          {/* The icon alone says nothing to a screen reader, and the colour
              alone nothing to a director who can't tell it apart. */}
          <span className="sr-only">Plan sugerido: {planSuggestionReason(candidate)}.</span>
        </>
      )}
      {candidate.name}
      <span className="text-muted-foreground num">
        · {candidate.overall_average.toFixed(2)}
        {candidate.has_plan ? ' (ya tiene plan)' : ''}
      </span>
    </>
  )
}

/** The half of a saved draft that overrides the seed the route computed. */
function restoredFields(draft: PlanFormDraft): Partial<PlanFormInitial> {
  return {
    periodId: draft.periodId,
    teacherId: draft.teacherId,
    titleOverride: draft.titleOverride,
    description: draft.description,
    facultyOverride: draft.facultyOverride,
    departmentOverride: draft.departmentOverride,
    programOverride: draft.programOverride,
    actaDate: draft.actaDate,
    actaNumber: draft.actaNumber,
    councilObservations: draft.councilObservations,
    departmentObservations: draft.departmentObservations,
    programObservations: draft.programObservations,
    items: draft.items,
    courses: draft.courses,
  }
}

function PlanForm({
  mode,
  plan,
  initial,
  periods,
  indicators,
  presetPeriodCode,
  draftKey,
  restoredAt,
  onDiscardDraft,
}: {
  mode: FormMode
  plan?: Plan
  initial: PlanFormInitial
  periods: PlanPeriod[]
  indicators: PlanIndicators
  presetPeriodCode: string | null
  /** Where this form's local backup is filed. */
  draftKey: string
  /** When the restored draft was written, or `null` if nothing was restored. */
  restoredAt: string | null
  onDiscardDraft: () => void
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

  // Deliberately outside the autosaved snapshot: a File can't be serialised, so
  // it is re-picked after a reload rather than silently lost on submit.
  const [caseReport, setCaseReport] = useState<File | null>(null)

  const [onlyWeak, setOnlyWeak] = useState(true)
  const [subjectKey, setSubjectKey] = useState(SUBJECT_ALL)
  const [items, setItems] = useState<DraftItem[]>(initial.items)
  const [courses, setCourses] = useState<DraftCourse[]>(initial.courses)

  // A required field goes red once it has been left empty, not while it is
  // still waiting its turn: `touched` grows on blur, and a failed submit turns
  // every pending error on at once.
  // Dismissing the restore notice only takes the notice down: what it restored
  // is still in the form, and "Descartar y empezar de nuevo" is what throws it
  // away. They are two different things and need two different controls.
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())
  const [showAllErrors, setShowAllErrors] = useState(false)

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
  const candidates = useMemo(() => candidatesResponse?.data ?? [], [candidatesResponse])
  const threshold = indicators.threshold ?? 3.5

  const candidate = candidates.find((entry) => entry.teacher_id === teacherId)

  /** Drives the legend: without it the icon on the options says nothing. */
  const suggestedCount = candidates.filter(
    (entry) => !entry.has_plan && isPlanSuggested(entry),
  ).length

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
  const uploadCaseReport = useUploadPlanDocument()
  const submission = isEdit ? updatePlan : createPlan

  const teacherName = candidate?.name ?? plan?.teacher_name ?? null

  const defaultTitle =
    teacherName && periodId
      ? `Plan de mejoramiento · ${teacherName} · ${period?.code ?? ''}`.trim()
      : ''

  const title = titleOverride ?? defaultTitle

  // At UFPS the director's own "department" is named after the programme it
  // serves, so it seeds PROGRAMA ACADÉMICO. Facultad and departamento académico
  // come from the evaluated teacher's own record, which the candidates endpoint
  // resolves for us; the faculty of the programme is only the last resort.
  const authDepartment = useAuthStore((state) => state.user?.department_name) ?? ''
  const programName = programOverride ?? authDepartment
  const departmentName = departmentOverride ?? candidate?.department_name ?? ''
  const facultyName =
    facultyOverride ?? candidate?.faculty_name ?? facultyOfProgram(programName)?.name ?? ''

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
  const pickerScope =
    workbench.effectiveSubjectKey === SUBJECT_ALL ? null : workbench.effectiveSubjectKey

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

    setItems((current) => [...current, buildIndicatorDraft(pick, subject)])
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
    // A manual commitment is written at teacher level — it doesn't come from
    // any one asignatura — so it covers every one he taught, exactly like an
    // indicator picked under "General". It is also what `pruneCourses` assumes,
    // and it is what keeps section 4 from being left empty.
    setCourses((current) => mergeCourses(current, coursesOfSubject(null, workbench.allSubjects)))
  }

  function patchItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function removeItem(key: string) {
    const next = items.filter((item) => item.key !== key)

    setItems(next)
    setCourses((current) => pruneCourses(current, next))
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

  /** Every asignatura of the teacher at once, the usual case. */
  function addAllCourses() {
    setCourses((current) => mergeCourses(current, coursesOfSubject(null, workbench.allSubjects)))
  }

  /** Subjects of the teacher that aren't already listed in the plan. */
  const addableSubjects = useMemo(() => {
    const listed = new Set(courses.map((course) => course.key))

    return workbench.allSubjects.filter(
      (subject) => !listed.has(courseRowKey(courseOfSubject(subject))),
    )
  }, [courses, workbench.allSubjects])

  /** Drives the counter of section 3, the reinforcement the director asked for. */
  const completeCount = useMemo(() => countCompleteCommitments(items), [items])

  /** Everything worth getting back after a reload. Nothing derived from a query. */
  const snapshot = {
    teacherId,
    periodId,
    titleOverride,
    description,
    facultyOverride,
    departmentOverride,
    programOverride,
    actaDate,
    actaNumber,
    councilObservations,
    departmentObservations,
    programObservations,
    items,
    courses,
  }

  // A signed acta rejects its own content, so there is nothing to keep a local
  // copy of — and restoring one later would only offer edits the API refuses.
  const draft = usePlanFormDraft(draftKey, snapshot, { enabled: !actaLocked })

  /** What is still missing, in the order the page paints it. */
  const errors = useMemo(
    () =>
      planFormErrors({
        isEdit,
        actaLocked,
        teacherId,
        periodId,
        title,
        items,
        aspects,
        courses,
        facultyName,
        departmentName,
        programName,
        actaNumber,
        actaDate,
      }),
    [
      isEdit,
      actaLocked,
      teacherId,
      periodId,
      title,
      items,
      aspects,
      courses,
      facultyName,
      departmentName,
      programName,
      actaNumber,
      actaDate,
    ],
  )

  /**
   * The errors worth painting right now, each against the id of the control it
   * belongs to. A field the director hasn't reached yet is not a mistake — it
   * goes red once they leave it empty, or once they try to save.
   *
   * The message travels with the id rather than being looked up again in the
   * markup: red alone is not an error message, so every field that turns red
   * also has to be able to say why, in words.
   */
  const invalidFields = useMemo<ReadonlyMap<string, string>>(
    () =>
      new Map(
        errors
          .filter((error) => showAllErrors || touched.has(error.id))
          .map((error) => [error.id, error.message]),
      ),
    [errors, showAllErrors, touched],
  )

  function markTouched(id: string) {
    setTouched((current) => (current.has(id) ? current : new Set(current).add(id)))
  }

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

  // `SubmitEvent` and not `FormEvent`: the latter is deprecated in the React 19
  // types ("FormEvent doesn't actually exist") because it never mapped to a real
  // DOM event. `onSubmit` is typed `SubmitEventHandler`, so this is the type the
  // prop actually hands over.
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function submit() {
    if (errors.length > 0) {
      // Three things at once, because any one of them alone leaves the director
      // hunting: the toast says what happened, the red says which fields, and
      // the scroll puts the cursor in the first of them.
      setShowAllErrors(true)
      toast.warning('Faltan campos obligatorios por completar.', {
        description: 'Revisa los campos marcados en rojo.',
      })
      focusField(errors[0].id)
      return
    }

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
        {
          onSuccess: () => {
            draft.discard()
            navigate(`/planes/${plan.id}`)
          },
        },
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
        onSuccess: async (response) => {
          const created = response.data

          if (!created) return

          draft.discard()

          // The plan exists from here on, so a failed attachment must not read
          // as a failed creation: the director is taken to the plan either way
          // and told the Formato 1 is still to be uploaded there.
          if (caseReport) {
            try {
              await uploadCaseReport.mutateAsync({
                planId: created.id,
                format: 'formato-1',
                file: caseReport,
              })
            } catch {
              toast.warning('El plan se creó, pero no se pudo adjuntar el Formato 1.', {
                description: 'Puedes subirlo desde los formatos oficiales del plan.',
              })
            }
          }

          navigate(`/planes/${created.id}`)
        },
      },
    )
  }

  return (
    // A real form, so Enter submits from any field and the browser hands the
    // page the semantics it already assumes. `noValidate` because the meta
    // esperada is a `number` input with a range: letting the browser stop the
    // submit with a bubble of its own would hide the errors below, which are
    // the ones that know about every other field too.
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <PageTitle>{isEdit ? 'Editar plan de mejoramiento' : 'Nuevo plan de mejoramiento'}</PageTitle>

      {actaLocked && (
        <InlineError message="El acuerdo está firmado: los compromisos, las asignaturas y los datos del acta ya no se pueden modificar. Para cambiarlos, elimina primero la Ficha de acuerdo firmada." />
      )}

      {restoredAt && !noticeDismissed && (
        <div
          className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
          role="status"
        >
          <p className="flex items-center gap-2 text-sm">
            <RotateCcw className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            Recuperamos lo que estabas escribiendo el {formatDate(restoredAt)}.
          </p>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onDiscardDraft}>
              Descartar y empezar de nuevo
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar el aviso"
              onClick={() => setNoticeDismissed(true)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <section className="border-border bg-card space-y-4 rounded-md border p-6">
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
              <Label htmlFor="period">
                Periodo de origen <Required />
              </Label>
              <Select
                value={periodId ?? null}
                onValueChange={(value) => {
                  setPeriodOverride(value as number)
                  setTeacherId(undefined)
                  resetPicking()
                }}
              >
                <SelectTrigger
                  id="period"
                  className="w-40"
                  aria-invalid={invalidFields.has('period')}
                  aria-describedby={
                    invalidFields.has('period') ? fieldErrorId('period') : undefined
                  }
                  onBlur={() => markTouched('period')}
                >
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

              <FieldError fieldId="period" message={invalidFields.get('period')} />
            </div>

            <div className="min-w-64 flex-1 space-y-1.5">
              <Label htmlFor="teacher">
                Docente <Required />
              </Label>
              <SearchSelect<PlanCandidate>
                id="teacher"
                value={candidate ?? null}
                onValueChange={(entry) => {
                  setTeacherId(entry?.teacher_id)
                  markTouched('teacher')
                  resetPicking()
                }}
                items={candidates}
                itemToKey={(entry) => entry.teacher_id}
                itemToLabel={(entry) => entry.name ?? ''}
                filter={(entry, query) =>
                  entry.institutional_code?.toLowerCase().includes(query.toLowerCase()) ?? false
                }
                isItemDisabled={(entry) => entry.has_plan}
                renderItem={(entry) => <CandidateOption candidate={entry} />}
                disabled={noPeriodYet || noCandidates}
                invalid={invalidFields.has('teacher')}
                describedBy={invalidFields.has('teacher') ? fieldErrorId('teacher') : undefined}
                loading={candidatesLoading}
                loadingLabel="Cargando docentes…"
                placeholder={teacherPlaceholder}
                emptyMessage="Sin docentes que coincidan."
              />

              <FieldError fieldId="teacher" message={invalidFields.get('teacher')} />

              {suggestedCount > 0 && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <AlertTriangle
                    className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="num">{suggestedCount}</span>{' '}
                    {suggestedCount === 1 ? 'docente' : 'docentes'} con plan sugerido por sus
                    resultados.
                  </span>
                </p>
              )}
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
          className="border-border bg-card space-y-4 rounded-md border p-6"
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
        <section className="border-border bg-card space-y-4 rounded-md border p-6">
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

      <section className="border-border bg-card space-y-4 rounded-md border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">3. Compromisos</h2>
            <p className="text-muted-foreground text-sm">
              Solo aparecen los aspectos de los formatos oficiales sobre los que marcaste algo en el
              paso 2. Puedes añadir compromisos a mano aunque no hayas marcado ningún indicador.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {items.length > 0 && (
              <p className="text-muted-foreground text-sm" role="status">
                <span className="num font-semibold">{completeCount}</span> de{' '}
                <span className="num font-semibold">{items.length}</span>{' '}
                {items.length === 1 ? 'compromiso completo' : 'compromisos completos'}
              </p>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" disabled={actaLocked}>
                    <Plus className="size-4" aria-hidden="true" />
                    Añadir compromiso manual
                  </Button>
                }
              />

              <DropdownMenuContent align="end">
                {aspects.map((aspect) => (
                  <DropdownMenuItem
                    key={aspect.aspect}
                    onClick={() => addQualitative(aspect.aspect)}
                  >
                    <span className="num text-muted-foreground mr-1.5">{aspect.aspect}.</span>
                    {aspect.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {items.length === 0 ? (
          // `tabIndex` so the failed-save scroll can put the cursor on a
          // paragraph; `outline-none` so it doesn't grow a focus ring for it.
          <p
            id={COMMITMENTS_ANCHOR_ID}
            tabIndex={-1}
            className={cn(
              'text-muted-foreground border-border rounded-md border border-dashed px-4 py-6 text-center text-sm outline-none',
              invalidFields.has(COMMITMENTS_ANCHOR_ID) && 'border-destructive text-destructive',
            )}
          >
            Todavía no hay compromisos: marca un indicador o un comentario en el paso 2, o añade uno
            a mano con el botón de arriba.
          </p>
        ) : (
          <CommitmentsEditor
            items={items}
            aspects={aspects}
            onChange={patchItem}
            onRemove={removeItem}
            invalidFields={invalidFields}
            onFieldBlur={markTouched}
            disabled={actaLocked}
          />
        )}

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
        <section className="border-border bg-card space-y-4 rounded-md border p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">4. Asignaturas</h2>
              <p className="text-muted-foreground text-sm">
                Se van agregando solas con lo que marcas arriba: en «General» entran todas las del
                docente; con una asignatura filtrada, sólo esa. Vienen del reporte de evaluación,
                así que no se editan: si sobra alguna, quítala.
              </p>
            </div>

            {workbench.allSubjects.length > 0 && !actaLocked && (
              <Select
                value={null}
                onValueChange={(value) => {
                  if (value === ALL_COURSES) {
                    addAllCourses()
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
                  {/* The usual case, so it leads the list instead of sitting in
                      a button of its own outside the field. */}
                  <SelectItem value={ALL_COURSES}>
                    <Layers className="size-4" aria-hidden="true" />
                    Añadir todas las del docente
                  </SelectItem>

                  <SelectSeparator />

                  {addableSubjects.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-1.5 text-sm">
                      Ya están todas las asignaturas del docente.
                    </p>
                  ) : (
                    addableSubjects.map((subject) => (
                      <SelectItem key={subject.key} value={subject.key}>
                        {subject.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {courses.length === 0 ? (
            <p
              id={COURSES_ANCHOR_ID}
              tabIndex={-1}
              className={cn(
                'text-muted-foreground border-border rounded-md border border-dashed px-4 py-6 text-center text-sm outline-none',
                invalidFields.has(COURSES_ANCHOR_ID) && 'border-destructive text-destructive',
              )}
            >
              Todavía no hay asignaturas: marca un indicador o un comentario y aparecerán aquí, o
              añádelas con el selector de arriba.
            </p>
          ) : (
            // Read-only on purpose: the name, the code and the group are what
            // the evaluation report says the teacher taught, and a plan that
            // renames them stops matching the record it is built on.
            <ul className="divide-border border-border divide-y rounded-md border">
              {courses.map((course) => (
                <li key={course.key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 text-sm font-medium">{course.course_name}</span>

                  {course.course_code && (
                    <span className="text-muted-foreground num text-xs">{course.course_code}</span>
                  )}

                  {course.group_name && (
                    <Badge variant="outline" className="num font-normal">
                      Grupo {course.group_name}
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actaLocked}
                    aria-label={`Quitar ${course.course_name}`}
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

      {!isEdit && <PlanCaseReportUpload file={caseReport} onFileChange={setCaseReport} />}

      <section className="border-border bg-card space-y-4 rounded-md border p-6">
        <h2 className="font-semibold">5. Datos del plan</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">
            Título{' '}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitleOverride(event.target.value)}
            onBlur={() => markTouched('title')}
            aria-invalid={invalidFields.has('title')}
            aria-describedby={invalidFields.has('title') ? fieldErrorId('title') : undefined}
          />

          <FieldError fieldId="title" message={invalidFields.get('title')} />
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
            <Label htmlFor="faculty">
              Facultad <Required />
            </Label>
            <Combobox
              id="faculty"
              value={facultyName}
              onValueChange={setFacultyOverride}
              options={FACULTY_NAMES}
              placeholder="Facultad"
              invalid={invalidFields.has('faculty')}
              describedBy={invalidFields.has('faculty') ? fieldErrorId('faculty') : undefined}
              onBlur={() => markTouched('faculty')}
            />

            <FieldError fieldId="faculty" message={invalidFields.get('faculty')} />
          </div>

          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="department">
              Departamento académico <Required />
            </Label>
            <Input
              id="department"
              value={departmentName}
              onChange={(event) => setDepartmentOverride(event.target.value)}
              placeholder="Escríbelo"
              aria-invalid={invalidFields.has('department')}
              aria-describedby={
                invalidFields.has('department') ? fieldErrorId('department') : undefined
              }
              onBlur={() => markTouched('department')}
            />

            <FieldError fieldId="department" message={invalidFields.get('department')} />

            <p className="text-muted-foreground text-xs">
              Viene del registro del docente evaluado; corrígelo si el formato debe decir otra cosa.
            </p>
          </div>

          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="program">
              Programa académico <Required />
            </Label>
            <Combobox
              id="program"
              value={programName}
              onValueChange={setProgramOverride}
              options={programOptions}
              placeholder="Programa"
              invalid={invalidFields.has('program')}
              describedBy={invalidFields.has('program') ? fieldErrorId('program') : undefined}
              onBlur={() => markTouched('program')}
            />

            <FieldError fieldId="program" message={invalidFields.get('program')} />
          </div>
        </div>

        {/* "ACTO ADMINISTRATIVO: ACTA No. ___ FECHA: ___" — the foot of the
            Ficha de acuerdo. It comes from the Consejo de Departamento session
            that approves the plan. */}
        <div className="flex flex-wrap gap-4 border-t pt-4">
          <div className="min-w-40 space-y-1.5">
            <Label htmlFor="acta-number">
              Acta N.º <Required />
            </Label>
            <Input
              id="acta-number"
              value={actaNumber}
              onChange={(event) => setActaNumber(event.target.value)}
              placeholder="Ej. 012"
              className="num"
              disabled={actaLocked}
              aria-invalid={invalidFields.has('acta-number')}
              aria-describedby={
                invalidFields.has('acta-number') ? fieldErrorId('acta-number') : undefined
              }
              onBlur={() => markTouched('acta-number')}
            />

            <FieldError fieldId="acta-number" message={invalidFields.get('acta-number')} />
          </div>

          <div className="min-w-56 space-y-1.5">
            <Label htmlFor="acta-date">
              Fecha del acta <Required />
            </Label>
            <DatePicker
              id="acta-date"
              value={actaDate}
              onChange={setActaDate}
              disabled={actaLocked}
              invalid={invalidFields.has('acta-date')}
              describedBy={invalidFields.has('acta-date') ? fieldErrorId('acta-date') : undefined}
              onBlur={() => markTouched('acta-date')}
            />

            <FieldError fieldId="acta-date" message={invalidFields.get('acta-date')} />
          </div>

          <p className="text-muted-foreground w-full text-xs">
            Del Consejo de Departamento que respalda el acuerdo. Es también la fecha de inicio del
            plan: se imprime en la Ficha de acuerdo (Formato 2) y en el Plan de seguimiento (Formato
            3), y hace falta para poder firmar el acta.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pb-8">
        {showAllErrors && errors.length > 0 && (
          <p className="text-destructive mr-auto text-xs" role="alert">
            {errors.length === 1
              ? 'Falta 1 campo obligatorio por completar.'
              : `Faltan ${errors.length} campos obligatorios por completar.`}
          </p>
        )}

        {draft.savedAt && (
          <p
            className={cn(
              'text-muted-foreground flex items-center gap-1.5 text-xs',
              !(showAllErrors && errors.length > 0) && 'mr-auto',
            )}
          >
            <Cloud className="size-3.5 shrink-0" aria-hidden="true" />
            {/* "En este navegador" on purpose: a director who reads plain
                "guardado" would think the plan is already filed. */}
            Guardado en este navegador · {formatDate(draft.savedAt, 'h:mm A')}
          </p>
        )}

        <Button
          variant="outline"
          onClick={() => navigate(isEdit && plan ? `/planes/${plan.id}` : '/planes')}
        >
          Cancelar
        </Button>
        {/* Never disabled: a dead button says nothing about what is missing.
            Pressing it is what points at the first empty field. */}
        <Button type="submit" disabled={submission.isPending}>
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
    </form>
  )
}
