/**
 * Hardcoded light-mode palette for `@react-pdf/renderer` documents — it has
 * no CSS engine, so it can't read the app's `var(--color-*)` custom
 * properties from `src/app/styles/index.css`. A report is always rendered in
 * light colors regardless of the app's current theme, so only the light
 * values are needed here. Keep in sync by hand: if the source values below
 * change, update this file too.
 */

import { riskLevelColor } from '@/lib/riskLevel'

export const pdfColors = {
  /** `--color-brand-600` in index.css. */
  brand: '#c93d2d',
  /** `--color-brand-700` in index.css — text set against `brandTint`. */
  brand700: '#a63326',
  /** `--color-brand-50` in index.css — the header/hero shading tint. */
  brandTint: '#fdf3f1',
  /** `--ink-900` in index.css — primary text. */
  ink900: '#0b0f17',
  /** `--ink-700` in index.css — secondary text. */
  ink700: '#2a2f3a',
  /** `--ink-500` in index.css — muted/label text. */
  ink500: '#6a707d',
  /** `--ink-200` in index.css — hairline borders. */
  ink200: '#e4e6ea',
  /** `--ink-100` in index.css — subtle section backgrounds. */
  ink100: '#f1f2f4',
  /** Risk semaphore, read off the one catalogue the screen charts also use. */
  riskLow: riskLevelColor('BAJO')!,
  riskMedium: riskLevelColor('MEDIO')!,
  riskHigh: riskLevelColor('ALTO')!,
} as const

/**
 * Pedagogical dimension colors, duplicated from `dimensionColor()` in
 * `src/lib/dimensionLabel.ts` — that function's fallback resolves to a CSS
 * custom property, which react-pdf can't use, so this map only covers the
 * app's fixed, known dimension set.
 */
export const pdfDimensionColors: Record<string, string> = {
  'Desarrollo del Conocimiento': '#3c8dbc',
  'Desempeño Docente': '#7c3aed',
  'Procesos de Evaluación': '#0d9488',
  'Integración Interpersonal': '#db2777',
}

/**
 * Resolves a comment's risk-level name (e.g. `TeacherComment.risk_level.name`,
 * which arrives with inconsistent casing) to its semaphore color.
 *
 * @example
 * pdfRiskColor(comment.risk_level?.name) // pdfColors.riskHigh, or undefined
 */
export function pdfRiskColor(name: string | undefined): string | undefined {
  return riskLevelColor(name)
}
