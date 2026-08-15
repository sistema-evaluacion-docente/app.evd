/**
 * Types of the "Plan de Mejoramiento Docente" module.
 *
 * They mirror the three official UFPS forms: the five *aspects* (the four
 * evaluation dimensions plus "Observaciones de los Estudiantes") are the axis
 * the commitments and the follow-ups are grouped by.
 */

export type TargetType =
  'DIMENSION' | 'QUESTION' | 'PEDAGOGICAL_CATEGORY' | 'OVERALL_AVERAGE' | 'QUALITATIVE'

export type PlanStatus =
  | 'BORRADOR'
  | 'EN_SEGUIMIENTO'
  | 'RESULTADO_DISPONIBLE'
  | 'CERRADO_CUMPLIDO'
  | 'CERRADO_NO_CUMPLIDO'
  | 'CERRADO_MANUAL'

/** Lifecycle of the acta, independent from the plan status. */
export type ActaStatus = 'BORRADOR' | 'CERRADA' | 'FIRMADA'

export type ItemStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'CUMPLIDO' | 'NO_CUMPLIDO'

export type CloseResult = 'CUMPLIDO' | 'NO_CUMPLIDO' | 'MANUAL'

/** The two formal follow-ups: week 8 and weeks 15/16. */
export type CheckpointStage = 'PRIMER_SEGUIMIENTO' | 'SEGUNDO_SEGUIMIENTO'

export type EvidenceStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export type EvidenceRequestStatus = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA'

/** The three official forms, as the API slugs them. */
export type PlanFormatSlug = 'formato-1' | 'formato-2' | 'formato-3'

/** A student comment cited as justification of a commitment. */
export interface PlanItemComment {
  comment_id: number
  original_text: string | null
  risk_level_name: string | null
  risk_score: number | null
}

export interface PlanItem {
  id: number
  plan_id: number
  description: string
  /** "Compromiso" of the official form — printed apart from the description. */
  commitment: string | null
  /** Section of the form this commitment belongs to (1-5). */
  aspect: number | null
  target_type: TargetType
  target_ref: string | null
  baseline_value: number | null
  target_value: number | null
  result_value: number | null
  status: ItemStatus
  order: number
  comments: PlanItemComment[]
}

/** One cell of the follow-up matrix: what was recorded for an aspect. */
export interface PlanCheckpointNote {
  id: number
  aspect: number
  note: string | null
}

export interface PlanCheckpoint {
  id: number
  plan_id: number
  stage: CheckpointStage
  scheduled_date: string | null
  completed_at: string | null
  status: string
  notes: string | null
  aspect_notes: PlanCheckpointNote[]
}

/** A row of the asignaturas table printed on Formatos 2 and 3. */
export interface PlanCourse {
  id: number
  plan_id: number
  academic_group_id: number | null
  course_name: string
  course_code: string | null
  group_name: string | null
  program_name: string | null
  order: number
}

/** Formato 1 — the complaint an academic program reported. */
export interface PlanCaseReport {
  id: number
  plan_id: number
  reported_by: number | null
  complaint: string | null
  observations: string | null
  committee_act_reference: string | null
}

/** Generated / physically signed copy of one official form. */
export interface PlanDocument {
  id: number
  plan_id: number
  format_type: 'FORMATO_1' | 'FORMATO_2' | 'FORMATO_3'
  generated_at: string | null
  generated_by: number | null
  signed_at: string | null
  signed_by: number | null
  has_generated: boolean
  has_signed: boolean
}

export interface PlanEvidence {
  id: number
  plan_id: number
  item_id: number | null
  request_id: number | null
  uploaded_by: number | null
  uploader_name: string | null
  description: string | null
  file_url: string
  status: EvidenceStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string | null
}

export interface PlanEvidenceComment {
  id: number
  request_id: number
  author_id: number | null
  author_name: string | null
  body: string
  is_system: boolean
  created_at: string | null
}

/** A deliverable the director asked the teacher for. */
export interface PlanEvidenceRequest {
  id: number
  plan_id: number
  item_id: number | null
  requested_by: number | null
  title: string
  description: string | null
  status: EvidenceRequestStatus
  due_date: string | null
  evidences: PlanEvidence[]
  comments: PlanEvidenceComment[]
  created_at: string | null
  updated_at: string | null
}

export interface Plan {
  id: number
  teacher_id: number
  teacher_name: string | null
  teacher_avatar_url: string | null
  department_id: number | null
  origin_period_id: number
  origin_period_code: string | null
  verification_period_id: number | null
  verification_period_code: string | null
  title: string
  description: string | null
  program_name: string | null
  /** Header of the official forms, frozen on the plan so it survives org changes. */
  faculty_name: string | null
  department_name: string | null
  status: PlanStatus
  close_reason: string | null
  start_date: string | null
  end_date: string | null
  created_by: number | null
  closed_at: string | null
  acta_number: string | null
  acta_date: string | null
  acta_status: ActaStatus
  acta_closed_at: string | null
  acta_closed_by: number | null
  /** True once the acta is closed: its content can no longer be edited. */
  acta_locked: boolean
  council_observations: string | null
  department_director_observations: string | null
  program_director_observations: string | null
  has_acta: boolean
  progress: number
  suggested_result: string | null
  items: PlanItem[]
  checkpoints: PlanCheckpoint[]
  evidences: PlanEvidence[]
  courses: PlanCourse[]
  case_report: PlanCaseReport | null
  documents: PlanDocument[]
  evidence_count: number
  created_at: string | null
  updated_at: string | null
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

export interface PlanItemInput {
  id?: number
  description: string
  commitment?: string | null
  aspect?: number | null
  target_type: TargetType
  target_ref?: string | null
  baseline_value?: number | null
  target_value?: number | null
  status?: ItemStatus
  order?: number
  comment_ids?: number[]
}

export interface PlanCourseInput {
  academic_group_id?: number | null
  course_name: string
  course_code?: string | null
  group_name?: string | null
  program_name?: string | null
  order?: number
}

export interface CreatePlanInput {
  teacher_id: number
  origin_period_id: number
  verification_period_id?: number | null
  title: string
  description?: string
  program_name?: string
  faculty_name?: string
  department_name?: string
  start_date?: string
  end_date?: string
  council_observations?: string
  department_director_observations?: string
  program_director_observations?: string
  items: PlanItemInput[]
  courses?: PlanCourseInput[]
}

export interface UpdatePlanInput {
  title?: string
  description?: string
  verification_period_id?: number | null
  program_name?: string
  faculty_name?: string
  department_name?: string
  start_date?: string
  end_date?: string
  acta_number?: string
  acta_date?: string
  council_observations?: string
  department_director_observations?: string
  program_director_observations?: string
  items?: PlanItemInput[]
  courses?: PlanCourseInput[]
}

export interface CaseReportInput {
  complaint?: string
  observations?: string
  committee_act_reference?: string
}

export interface CheckpointInput {
  scheduled_date?: string
  status?: string
  notes?: string
  aspect_notes?: { aspect: number; note: string }[]
}

export interface ClosePlanInput {
  result: CloseResult
  reason?: string
}

export interface EvidenceRequestInput {
  title: string
  description?: string
  item_id?: number | null
  due_date?: string
}

export interface EvidenceReviewInput {
  status: EvidenceStatus
  comment?: string
}

/* -------------------------------------------------------------------------- */
/* Catalogues and candidates                                                   */
/* -------------------------------------------------------------------------- */

/** One question of the evaluation form (e.g. "011 · Asiste puntualmente a clase"). */
export interface IndicatorQuestion {
  target_type: 'QUESTION'
  target_ref: string
  code: string
  text: string
  average: number | null
  below_threshold: boolean
  suggestions: string[]
}

/** A dimension: its own overall score plus every question inside it. */
export interface IndicatorDimension {
  dimension: string
  target_type: 'DIMENSION'
  target_ref: string
  average: number | null
  below_threshold: boolean
  suggestions: string[]
  questions: IndicatorQuestion[]
}

export type WeakQuestion = IndicatorQuestion & { dimension: string }

/**
 * A teacher that can receive a plan. The whole department is returned, not only
 * the ones under the threshold: a teacher can average 4.0 overall and still be
 * at 2.0 in punctuality, and the director is the one who decides.
 */
export interface PlanCandidate {
  teacher_id: number
  name: string | null
  avatar_url: string | null
  institutional_code: string | null
  overall_average: number
  below_threshold: boolean
  has_plan: boolean
  dimensions: IndicatorDimension[]
  weak_dimensions: IndicatorDimension[]
  weak_questions: WeakQuestion[]
  overall_suggestions: string[]
}

/** `GET /improvement-plans/candidates` returns the teachers directly; the
 *  institutional threshold comes from `GET /improvement-plans/indicators`. */
export type PlanCandidates = PlanCandidate[]

export type AtRiskTeacher = PlanCandidate

/** A period whose grades are already loaded: candidate origin period for a plan. */
export interface PlanPeriod {
  id: number
  code: string
  name: string | null
}

/** An asignatura the teacher taught, used to prefill the forms. */
export interface TeacherCourseOption {
  academic_group_id: number
  course_name: string | null
  course_code: string | null
  group_name: string | null
}

export interface TeacherHistoryPeriod {
  period_code: string
  period_name: string | null
  overall_average: number | null
  dimensions: Record<string, number | null>
}

/** An indicator targeted by plans of two or more different periods. */
export interface PlanRecurrence {
  target_type: TargetType
  target_ref: string | null
  label: string
  plan_ids: number[]
  period_codes: string[]
}

export interface TeacherPlanHistory {
  teacher_id: number
  teacher_name: string | null
  teacher_avatar_url: string | null
  department_id: number | null
  periods: TeacherHistoryPeriod[]
  plans: Plan[]
  recurrences: PlanRecurrence[]
}

/** One of the five sections of the official forms. */
export interface PlanAspect {
  aspect: number
  label: string
  dimension: string | null
}

/** Catalogue of indicators a commitment can be attached to. */
export interface PlanIndicators {
  threshold: number
  aspects: PlanAspect[]
  overall: {
    target_type: 'OVERALL_AVERAGE'
    target_ref: null
    label: string
    suggestions: string[]
  }
  dimensions: {
    dimension: string
    target_type: 'DIMENSION'
    target_ref: string
    label: string
    suggestions: string[]
    questions: {
      target_type: 'QUESTION'
      target_ref: string
      code: string
      text: string
      suggestions: string[]
    }[]
  }[]
}

/* -------------------------------------------------------------------------- */
/* Creation workbench (client-side only)                                       */
/* -------------------------------------------------------------------------- */

/** One subject (course + group) of a teacher, as offered by the filter. */
export interface PlanSubjectOption {
  /** `courseKey(course)` — stable identity of the course+group pair. */
  key: string
  label: string
  course_name: string
  course_code: string | null
  group_name: string | null
  academic_group_id: number | null
}

/** A commitment being drafted before the plan is saved. */
export interface DraftItem {
  /** Client-side id so React can key rows that have no server id yet. */
  key: string
  /**
   * Identity of what was picked, so the picker can toggle it back off. The
   * same indicator picked under two subjects yields two different ids.
   */
  selection_id: string
  id?: number
  description: string
  commitment: string
  aspect: number | null
  target_type: TargetType
  target_ref: string | null
  baseline_value: number | null
  target_value: number | null
  suggestions: string[]
  comment_ids: number[]
  /** Verbatim comments cited by this commitment, to show them while drafting. */
  comment_previews: { id: number; text: string; risk_level_name: string | null }[]
  /** Subject the indicator was read from; `null` when picked at teacher level. */
  source_subject_key: string | null
  source_subject_label: string | null
}

/** An asignatura row of the plan, tracking whether the picker put it there. */
export interface DraftCourse extends PlanCourseInput {
  key: string
  /** `auto` rows follow the picking; `manual` ones are the director's own. */
  origin: 'auto' | 'manual'
}
