import {
  Building2,
  CircleAlert,
  CircleMinus,
  MailCheck,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'

import { STATUS_TONE_CLASS, type StatusTone } from '@/lib/statusTone'

import type { TeacherEmailImportStatus, TeacherEmailImportSummary } from '../types'

/**
 * How each outcome of the teacher email import is shown, in the order the
 * results table lists them: what needs the director's attention first.
 * `description` is the plain-language meaning shown in the results legend.
 *
 * "Ya tiene acceso" wears `accent` (blue) rather than `info`: `info` is the
 * brand red, and next to the red of an error the two read as the same alarm.
 */
export const EMAIL_IMPORT_STATUS: Record<
  TeacherEmailImportStatus,
  { label: string; tone: StatusTone; className: string; order: number; description: string }
> = {
  error: {
    label: 'Error',
    tone: 'danger',
    className: STATUS_TONE_CLASS.danger,
    order: 0,
    description:
      'La fila no se procesó. El detalle dice por qué: falta el código o el correo, el código no es numérico, el correo no es @ufps.edu.co, está repetido en el archivo o ya pertenece a otro usuario. Corrígela y vuelve a subir el archivo.',
  },
  other_department: {
    label: 'Otro departamento',
    tone: 'warning',
    className: STATUS_TONE_CLASS.warning,
    order: 1,
    description:
      'El docente está registrado en otro departamento, así que no se modificó. Su correo lo registra el director de ese departamento.',
  },
  already_active: {
    label: 'Ya tiene acceso',
    tone: 'accent',
    className: STATUS_TONE_CLASS.accent,
    order: 2,
    description:
      'El docente ya inició sesión en la plataforma. Se respetó el correo con el que entra y no se cambió.',
  },
  created: {
    label: 'Registrado',
    tone: 'success',
    className: STATUS_TONE_CLASS.success,
    order: 3,
    description:
      'El código no existía: se registró como docente de tu departamento con ese correo. Su nombre se completa cuando subas su evaluación.',
  },
  updated: {
    label: 'Correo actualizado',
    tone: 'success',
    className: STATUS_TONE_CLASS.success,
    order: 4,
    description: 'Se registró el correo del docente. Ya puede iniciar sesión con él.',
  },
  unchanged: {
    label: 'Sin cambios',
    tone: 'neutral',
    className: STATUS_TONE_CLASS.neutral,
    order: 5,
    description: 'El docente ya tenía ese correo; no había nada que cambiar.',
  },
}

/**
 * The tinted surface of a summary counter, per tone: the same hues as the
 * status badges, with a border so the card holds its edge on a white page.
 */
export const COUNTER_TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted/50 text-muted-foreground',
  info: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-200',
  accent:
    'border-secondary-200 bg-secondary-50 text-secondary-700 dark:border-secondary-900 dark:bg-secondary-900/40 dark:text-secondary-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  danger:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
}

/** The summary counters, each tied to the status it counts. */
export const EMAIL_IMPORT_COUNTERS: {
  key: keyof Omit<TeacherEmailImportSummary, 'total'>
  status: TeacherEmailImportStatus
  label: string
  icon: LucideIcon
}[] = [
  { key: 'updated', status: 'updated', label: 'Correos actualizados', icon: MailCheck },
  { key: 'created', status: 'created', label: 'Docentes registrados', icon: UserPlus },
  { key: 'unchanged', status: 'unchanged', label: 'Sin cambios', icon: CircleMinus },
  { key: 'already_active', status: 'already_active', label: 'Ya tenían acceso', icon: UserCheck },
  {
    key: 'other_department',
    status: 'other_department',
    label: 'De otro departamento',
    icon: Building2,
  },
  { key: 'errors', status: 'error', label: 'Con errores', icon: CircleAlert },
]
