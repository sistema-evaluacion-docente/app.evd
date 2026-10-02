import { STATUS_TONE_CLASS } from '@/lib/statusTone'

import type { TeacherEmailImportStatus, TeacherEmailImportSummary } from '../types'

/**
 * How each outcome of the teacher email import is shown, in the order the
 * results table lists them: what needs the director's attention first.
 */
export const EMAIL_IMPORT_STATUS: Record<
  TeacherEmailImportStatus,
  { label: string; className: string; order: number }
> = {
  error: { label: 'Error', className: STATUS_TONE_CLASS.danger, order: 0 },
  other_department: {
    label: 'Otro departamento',
    className: STATUS_TONE_CLASS.warning,
    order: 1,
  },
  already_active: { label: 'Ya tiene acceso', className: STATUS_TONE_CLASS.info, order: 2 },
  created: { label: 'Registrado', className: STATUS_TONE_CLASS.success, order: 3 },
  updated: { label: 'Correo actualizado', className: STATUS_TONE_CLASS.success, order: 4 },
  unchanged: { label: 'Sin cambios', className: STATUS_TONE_CLASS.neutral, order: 5 },
}

/** The summary counters, each tied to the status it counts. */
export const EMAIL_IMPORT_COUNTERS: {
  key: keyof Omit<TeacherEmailImportSummary, 'total'>
  status: TeacherEmailImportStatus
  label: string
}[] = [
  { key: 'updated', status: 'updated', label: 'Correos actualizados' },
  { key: 'created', status: 'created', label: 'Docentes registrados' },
  { key: 'unchanged', status: 'unchanged', label: 'Sin cambios' },
  { key: 'already_active', status: 'already_active', label: 'Ya tenían acceso' },
  { key: 'other_department', status: 'other_department', label: 'De otro departamento' },
  { key: 'errors', status: 'error', label: 'Con errores' },
]
