/**
 * Maps a full evaluation dimension name to its short display label, ascii
 * key, and the chart color it's drawn in across the teacher detail page —
 * keeping the hero, legends, and charts visually in sync.
 *
 * Colors are a categorical identity palette deliberately kept OUT of the
 * red/amber/green range reserved by the app's score semaphore
 * (`lib/scoreTone.ts`) — a dimension's identity color used to double as
 * red/orange/green (the exact semaphore hues), so a genuinely excellent
 * "Desarrollo del Conocimiento" score still rendered in red and read as bad.
 * An earlier pass (blue/indigo/teal/purple) cleared the validator's minimum
 * thresholds but still read as "too similar" at a glance, since 3 of the 4
 * hues sat in the same blue-violet family. This set assigns explicit hues
 * requested for each dimension — blue, violet, teal, rose — spread across 4
 * wider hue families. "Evaluación" intentionally uses teal rather than green:
 * green is reserved by the semaphore (`lib/scoreTone.ts`), and reusing it
 * here would reintroduce the exact bug this palette was built to fix (a
 * dimension's identity color reading as a good/bad signal on its own). Teal
 * was chosen over a lighter cyan specifically because cyan, while passing the
 * validator's adjacent-pair check (the right check for 4 bars in a fixed
 * order), still reads as "a lighter blue" at a glance when compared directly
 * against "Desarrollo del Conocimiento" — a real dashboard shows all 4 bars
 * at once, so an all-pairs comparison matters here too. Teal clears the
 * adjacent-pair check cleanly but sits in the CVD warn band (6–8) against
 * rose for deuteranopia/protanopia — legal only because every bar is always
 * paired with its full text label (the "relief rule"), never color alone.
 * Validated with the `dataviz` skill's `validate_palette.js` in this exact
 * order (the fixed order these 4 dimensions always render in) against both
 * the light and dark app surfaces.
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
