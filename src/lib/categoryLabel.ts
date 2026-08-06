/**
 * Maps the raw pedagogical category codes returned by the AI analysis
 * (`LABEL_0`…`LABEL_4`) to their human label, a short label for tight spaces,
 * and the chart color of the evaluation dimension they belong to — so a
 * comment's category reads in the same color as its dimension in the charts.
 */
const CATEGORY_META: Record<string, { label: string; short: string; color: string }> = {
  LABEL_0: {
    label: 'Desarrollo del conocimiento',
    short: 'Conocimiento',
    color: 'var(--color-chart-1)',
  },
  LABEL_1: {
    label: 'Desempeño docente',
    short: 'Desempeño',
    color: 'var(--color-chart-2)',
  },
  LABEL_2: {
    label: 'Procesos de evaluación',
    short: 'Evaluación',
    color: 'var(--color-chart-4)',
  },
  LABEL_3: {
    label: 'Integración interpersonal',
    short: 'Relaciones',
    color: 'var(--color-chart-3)',
  },
  LABEL_4: {
    label: 'Sin categoría',
    short: 'Sin categoría',
    color: 'var(--color-muted-foreground)',
  },
}

const UNCATEGORIZED = 'LABEL_4'
const FALLBACK_COLOR = 'var(--color-muted-foreground)'

/** Normalizes an incoming category name to its `LABEL_n` key when possible. */
function metaOf(name?: string | null) {
  if (!name) return undefined

  return CATEGORY_META[name.trim().toUpperCase()]
}

/**
 * Resolves a raw category code to its readable label. Unknown values are
 * returned untouched, so a backend rename degrades gracefully instead of
 * showing an empty tag.
 *
 * @example
 * categoryLabel('LABEL_1') // "Desempeño docente"
 */
export function categoryLabel(name?: string | null) {
  if (!name) return CATEGORY_META[UNCATEGORIZED].label

  return metaOf(name)?.label ?? name
}

/**
 * Short label for tight spaces (filter chips, legends, table cells).
 *
 * @example
 * categoryShortLabel('LABEL_2') // "Evaluación"
 */
export function categoryShortLabel(name?: string | null) {
  if (!name) return CATEGORY_META[UNCATEGORIZED].short

  return metaOf(name)?.short ?? name
}

/**
 * Color assigned to a category, matched to its evaluation dimension in the
 * charts. Falls back to the color the API sent, then to the muted foreground.
 *
 * @example
 * categoryColor('LABEL_0') // "var(--color-chart-1)"
 * categoryColor('LABEL_9', '#3c8dbc') // "#3c8dbc"
 */
export function categoryColor(name?: string | null, fallback?: string | null) {
  return metaOf(name)?.color ?? fallback ?? FALLBACK_COLOR
}

/**
 * Whether the analysis could not assign a pedagogical category, so the UI can
 * de-emphasize it instead of presenting it as a real classification.
 *
 * @example
 * isUncategorized('LABEL_4') // true
 */
export function isUncategorized(name?: string | null) {
  return !name || name.trim().toUpperCase() === UNCATEGORIZED
}
