/**
 * Maps a full evaluation dimension name to its short display label, ascii
 * key, and the chart color it's drawn in across the teacher detail page —
 * keeping the hero, legends, and charts visually in sync.
 */
const DIMENSION_META: Record<string, { label: string; key: string; color: string }> = {
  'Desarrollo del Conocimiento': {
    label: 'Desarrollo del Conocimiento',
    key: 'conocimiento',
    color: '#3c8dbc',
  },
  'Desempeño Docente': {
    label: 'Desempeño Docente',
    key: 'desempeno',
    color: '#7c3aed',
  },
  'Procesos de Evaluación': {
    label: 'Procesos de Evaluación',
    key: 'evaluacion',
    color: '#0d9488',
  },
  'Integración Interpersonal': {
    label: 'Integración Interpersonal',
    key: 'relaciones',
    color: '#db2777',
  },
}

const FALLBACK_COLOR = 'var(--color-muted-foreground)'

/**
 * Shortens a full evaluation dimension name (e.g. "Desarrollo del
 * Conocimiento") to its compact display label (e.g. "Conocimiento") for use
 * in tight UI spaces like chart axes and stat columns. Falls back to the
 * original name when no mapping exists.
 *
 * @example
 * shortenDimensionLabel('Desempeño Docente') // "Desempeño"
 */
export function shortenDimensionLabel(dimension: string) {
  return DIMENSION_META[dimension]?.label ?? dimension
}

/**
 * Derives a stable, ascii-only key for a full dimension name, safe for use
 * as an object key or CSS custom property name (e.g. in chart configs).
 * Falls back to a lowercased, whitespace-stripped version of the name.
 *
 * @example
 * dimensionKey('Integración Interpersonal') // "relaciones"
 */
export function dimensionKey(dimension: string) {
  return DIMENSION_META[dimension]?.key ?? dimension.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Resolves the chart color assigned to a dimension, so any UI referencing
 * dimensions by name (hero stats, legends, tooltips) can stay color-matched
 * with the charts.
 *
 * @example
 * dimensionColor('Desempeño Docente') // "#6d5fe8"
 */
export function dimensionColor(dimension: string) {
  return DIMENSION_META[dimension]?.color ?? FALLBACK_COLOR
}
