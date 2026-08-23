/**
 * The soft badge a status wears, in the six tones the app uses for them.
 *
 * There were four copies of this vocabulary — `plans/lib/planStatus.ts`,
 * `evaluations/config/status.ts`, `ActiveBadge` and `admin/config` — and they
 * had drifted: `dark:bg-emerald-950/40` in one, `dark:bg-emerald-950` in two,
 * and no dark variant at all in the fourth, which left dark-mode green text on
 * a near-white pill.
 *
 * Kept apart from `scoreTone`'s `SCORE_TONE_BADGE_CLASS` on purpose: this says
 * *where something is* in a workflow (activo, procesando, fallido), not how
 * good a number is. They happen to share a traffic-light reading, but a status
 * gains a `neutral`, an `info` and an `accent` that a score has no use for.
 *
 * @example
 * <Badge className={STATUS_TONE_CLASS.success}>Completado</Badge>
 */
export const STATUS_TONE_CLASS = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200',
  accent: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
} as const

/** One of the tones a status badge can take. */
export type StatusTone = keyof typeof STATUS_TONE_CLASS
