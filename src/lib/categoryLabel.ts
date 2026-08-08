/** A pedagogical category as presented in the UI. */
export interface CategoryMeta {
  id: 1 | 2 | 3 | 4 | 5
  /** Raw code returned by the API (`LABEL_0`…`LABEL_4`). */
  code: string
  label: string
  /** Short label for tight spaces (chips, legends, axes). */
  short: string
  /** What the category covers, shown in the help popover. */
  description: string
  /** Chart color of the evaluation dimension the category belongs to. */
  color: string
}

/**
 * Maps the raw pedagogical category codes returned by the AI analysis
 * (`LABEL_0`…`LABEL_4`) to their human label, a short label for tight spaces,
 * what they cover, and the chart color of the evaluation dimension they belong
 * to — so a comment's category reads in the same color as its dimension in the
 * charts.
 */
const CATEGORY_META: Record<string, CategoryMeta> = {
  LABEL_0: {
    id: 1,
    code: 'LABEL_0',
    label: 'Desarrollo del conocimiento',
    short: 'Conocimiento',
    description:
      'Dominio de la asignatura, claridad al explicar los temas y actualización de los contenidos.',
    color: 'var(--color-chart-1)',
  },
  LABEL_1: {
    id: 2,
    code: 'LABEL_1',
    label: 'Desempeño docente',
    short: 'Desempeño',
    description:
      'Planeación de las clases, metodología, uso del tiempo, puntualidad y cumplimiento del programa.',
    color: 'var(--color-chart-2)',
  },
  LABEL_2: {
    id: 3,
    code: 'LABEL_2',
    label: 'Procesos de evaluación',
    short: 'Evaluación',
    description:
      'Claridad y pertinencia de los criterios, coherencia con lo visto en clase y retroalimentación de las notas.',
    color: 'var(--color-chart-4)',
  },
  LABEL_3: {
    id: 4,
    code: 'LABEL_3',
    label: 'Integración interpersonal',
    short: 'Relaciones',
    description:
      'Respeto y trato con el grupo, disposición para resolver dudas y acompañamiento a los estudiantes.',
    color: 'var(--color-chart-3)',
  },
  LABEL_4: {
    id: 5,
    code: 'LABEL_4',
    label: 'Sin categoría',
    short: 'Sin categoría',
    description:
      'El comentario no aporta información suficiente para ubicarlo en ninguna de las categorías anteriores.',
    color: 'var(--color-muted-foreground)',
  },
}

/** Every category in display order, for legends and help panels. */
export const CATEGORIES: CategoryMeta[] = Object.values(CATEGORY_META)

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
 * What the category covers, for tooltips and the help popover. Falls back to
 * the description the API sent, then to an empty string.
 *
 * @example
 * categoryDescription('LABEL_3') // "Respeto y trato con el grupo, ..."
 */
export function categoryDescription(name?: string | null, fallback?: string | null) {
  return metaOf(name)?.description ?? fallback ?? ''
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
