/** A risk level as presented in the UI. */
export interface RiskLevelMeta {
  id: 1 | 2 | 3
  /** Code the API counts them under, and the key of every `*_risk_counts` map. */
  key: RiskLevelKey
  name: string
  /**
   * Hex rather than a Tailwind class: Recharts and react-pdf both want a real
   * colour. Same green/amber/red as the score semaphore in `scoreTone.ts`.
   */
  color: string
}

/** How the API spells a risk level. */
export type RiskLevelKey = 'BAJO' | 'MEDIO' | 'ALTO'

/**
 * Fixed catalog of risk levels a comment can be classified into. There is no
 * endpoint to list them — same as `CATEGORIES` in `categoryLabel.ts` — so
 * they're hardcoded here, the one place to update if the backend ever adds
 * another level.
 *
 * The colours live here too. Four components and the PDF palette each had their
 * own copy of the same three literals, and one of them had drifted to a
 * different green, amber and red — so the very same "Alto" bar came out one
 * shade in the department chart and another in the subject comparison.
 */
export const RISK_LEVELS: RiskLevelMeta[] = [
  { id: 1, key: 'BAJO', name: 'Bajo', color: '#22c55e' },
  { id: 2, key: 'MEDIO', name: 'Medio', color: '#f59e0b' },
  { id: 3, key: 'ALTO', name: 'Alto', color: '#ef4444' },
]

/**
 * Colour of a risk level by the name the API sends, whatever its casing.
 *
 * @example
 * riskLevelColor(comment.risk_level?.name) // → "#ef4444", or undefined
 */
export function riskLevelColor(name: string | undefined | null): string | undefined {
  const key = name?.toUpperCase()

  return RISK_LEVELS.find((level) => level.key === key)?.color
}

/**
 * Whether a risk level is one worth acting on — `MEDIO` or `ALTO`.
 *
 * Lives here and not in a feature so the plans module and the teacher's own
 * summary can't disagree on what "riesgo" means. The name is trusted first
 * because the API sends it in unpredictable casing; the id is the fallback for
 * the payloads that carry no name.
 *
 * @example
 * isRiskyLevel(comment.risk_level) // → true for Medio y Alto
 */
export function isRiskyLevel(
  level: { id?: number | null; name?: string | null } | null | undefined,
): boolean {
  const key = level?.name?.toUpperCase()

  if (key) return key === 'MEDIO' || key === 'ALTO'

  // Ids of `RISK_LEVELS`: 1 Bajo, 2 Medio, 3 Alto.
  return (level?.id ?? 0) >= 2
}

/**
 * Resolves a risk level id to its readable name. Unknown ids are returned as
 * `undefined` so callers can fall back to whatever the API sent.
 *
 * @example
 * riskLevelName(2) // "Medio"
 */
export function riskLevelName(id?: number | null) {
  return RISK_LEVELS.find((level) => level.id === id)?.name
}
