import type {
  ActaStatus,
  CheckpointStage,
  EvidenceRequestStatus,
  EvidenceStatus,
  Plan,
  PlanCheckpoint,
  PlanEvidence,
  PlanStatus,
} from '../types'

/**
 * Human labels and tone classes for the module's statuses.
 *
 * Tones reuse the same emerald/amber/red vocabulary as `ActiveBadge` and
 * `scoreTone` so a plan reads consistently with the rest of the app.
 */

const NEUTRAL = 'bg-muted text-muted-foreground'
const INFO = 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
const SUCCESS = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
const WARNING = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
const DANGER = 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  BORRADOR: 'Borrador',
  EN_SEGUIMIENTO: 'En seguimiento',
  RESULTADO_DISPONIBLE: 'Resultado disponible',
  CERRADO_CUMPLIDO: 'Cerrado · cumplido',
  CERRADO_NO_CUMPLIDO: 'Cerrado · no cumplido',
  CERRADO_MANUAL: 'Cerrado manualmente',
}

export const PLAN_STATUS_CLASS: Record<PlanStatus, string> = {
  BORRADOR: NEUTRAL,
  EN_SEGUIMIENTO: INFO,
  RESULTADO_DISPONIBLE: WARNING,
  CERRADO_CUMPLIDO: SUCCESS,
  CERRADO_NO_CUMPLIDO: DANGER,
  CERRADO_MANUAL: NEUTRAL,
}

export const ACTA_STATUS_LABEL: Record<ActaStatus, string> = {
  BORRADOR: 'Acta en borrador',
  CERRADA: 'Acta cerrada',
  FIRMADA: 'Acta firmada',
}

export const ACTA_STATUS_CLASS: Record<ActaStatus, string> = {
  BORRADOR: NEUTRAL,
  CERRADA: WARNING,
  FIRMADA: SUCCESS,
}

export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = {
  PENDIENTE: 'Pendiente de revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
}

export const EVIDENCE_STATUS_CLASS: Record<EvidenceStatus, string> = {
  PENDIENTE: NEUTRAL,
  APROBADA: SUCCESS,
  RECHAZADA: DANGER,
}

export const REQUEST_STATUS_LABEL: Record<EvidenceRequestStatus, string> = {
  PENDIENTE: 'Pendiente de entrega',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
}

export const REQUEST_STATUS_CLASS: Record<EvidenceRequestStatus, string> = {
  PENDIENTE: NEUTRAL,
  EN_REVISION: WARNING,
  APROBADA: SUCCESS,
  RECHAZADA: DANGER,
}

/**
 * How a submitted evidence is called: the name it was uploaded under.
 *
 * `PlanEvidence` has no filename of its own — unlike `PlanDocument`, the API
 * doesn't keep the one on disk — so the name travels in `description`, which
 * the attach dialog fills in from the file. Older entries were uploaded before
 * that, hence the fallback on the row's own id.
 *
 * @example
 * evidenceLabel({ id: 12, description: 'listas_asistencia.pdf' })
 * // → 'listas_asistencia.pdf'
 */
export function evidenceLabel(evidence: Pick<PlanEvidence, 'id' | 'description'>): string {
  return evidence.description?.trim() || `Evidencia #${evidence.id}`
}

/**
 * The name to save it under. The label is free text the teacher can edit, so
 * the extension is put back when it isn't already there — the API only ever
 * serves these as PDFs.
 *
 * @example
 * evidenceFileName({ id: 12, description: 'Listas de asistencia' })
 * // → 'Listas de asistencia.pdf'
 */
export function evidenceFileName(evidence: Pick<PlanEvidence, 'id' | 'description'>): string {
  const label = evidenceLabel(evidence)

  return label.toLowerCase().endsWith('.pdf') ? label : `${label}.pdf`
}

/** The official form defines exactly two follow-ups per semester. */
export const CHECKPOINT_LABEL: Record<CheckpointStage, string> = {
  PRIMER_SEGUIMIENTO: 'Primer seguimiento',
  SEGUNDO_SEGUIMIENTO: 'Segundo seguimiento',
}

export const CHECKPOINT_HINT: Record<CheckpointStage, string> = {
  PRIMER_SEGUIMIENTO: 'Semana 8 desde el inicio del plan',
  SEGUNDO_SEGUIMIENTO: 'Semanas 15 y/o 16 desde el inicio del plan',
}

export const CHECKPOINT_ORDER: CheckpointStage[] = ['PRIMER_SEGUIMIENTO', 'SEGUNDO_SEGUIMIENTO']

/** How far Formato 3 has been carried, said the way the form names its columns. */
const CHECKPOINT_SHORT_LABEL: Record<CheckpointStage, string> = {
  PRIMER_SEGUIMIENTO: 'Semana 8',
  SEGUNDO_SEGUIMIENTO: 'Semanas 15/16',
}

/** A seguimiento counts as recorded once it carries a date or any observation. */
function isCheckpointRecorded(checkpoint: PlanCheckpoint): boolean {
  return (
    Boolean(checkpoint.scheduled_date) ||
    checkpoint.aspect_notes.some((note) => Boolean(note.note?.trim()))
  )
}

/**
 * The cut Formato 3 currently reflects, or `null` while no seguimiento has been
 * recorded. The API re-renders the form every time one is saved, so this is
 * read backwards: the form prints both columns, and the later stage is the one
 * that describes what the PDF now says.
 *
 * @example
 * followupFormatStage(plan) // → 'Semanas 15/16'
 */
export function followupFormatStage(plan: Plan): string | null {
  for (const stage of [...CHECKPOINT_ORDER].reverse()) {
    const checkpoint = plan.checkpoints.find((entry) => entry.stage === stage)

    if (checkpoint && isCheckpointRecorded(checkpoint)) return CHECKPOINT_SHORT_LABEL[stage]
  }

  return null
}

/** How complete a drafted commitment is. */
export type CommitmentState = 'complete' | 'missing-description' | 'missing-commitment'

/** A plan is closed when its status is any of the terminal ones. */
export function isPlanClosed(status: PlanStatus): boolean {
  return status.startsWith('CERRADO_')
}

/** The three official forms, in the order the director works through them. */
export const PLAN_FORMATS = [
  {
    slug: 'formato-1' as const,
    key: 'FORMATO_1' as const,
    name: 'Formato 1 · Caso reportado',
    description: 'Caso remitido por un programa académico a la dirección de departamento.',
  },
  {
    slug: 'formato-2' as const,
    key: 'FORMATO_2' as const,
    name: 'Formato 2 · Ficha de acuerdo',
    description: 'Acta de acuerdo de mejoramiento y compromiso docente.',
  },
  {
    slug: 'formato-3' as const,
    key: 'FORMATO_3' as const,
    name: 'Formato 3 · Plan de seguimiento',
    description: 'Matriz de seguimiento con los dos cortes del semestre.',
  },
]

/** Stable key for an indicator, matching how the API identifies it. */
export function indicatorKey(targetType: string, targetRef: string | null): string {
  return `${targetType}:${targetRef ?? ''}`
}

/**
 * How complete a drafted commitment is, for the card that holds it to say so.
 *
 * Only the description is required by the form itself — `commitment` is
 * nullable on the API — but the Ficha de acuerdo can't be signed until at least
 * one commitment carries its text, so an empty one is still worth flagging.
 *
 * @example
 * commitmentState({ description: 'Metodología (3.10)', commitment: '' })
 * // → 'missing-commitment'
 */
export function commitmentState(item: {
  description: string
  commitment: string
}): CommitmentState {
  if (item.description.trim().length === 0) return 'missing-description'
  if (item.commitment.trim().length === 0) return 'missing-commitment'

  return 'complete'
}

/** Whether every commitment of the list is filled in, for the section counter. */
export function countCompleteCommitments(
  items: { description: string; commitment: string }[],
): number {
  return items.filter((item) => commitmentState(item) === 'complete').length
}
