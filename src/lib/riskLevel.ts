/** A risk level as presented in the UI. */
export interface RiskLevelMeta {
  id: 1 | 2 | 3
  name: string
}

/**
 * Fixed catalog of risk levels a comment can be classified into. There is no
 * endpoint to list them — same as `CATEGORIES` in `categoryLabel.ts` — so
 * they're hardcoded here, the one place to update if the backend ever adds
 * another level.
 */
export const RISK_LEVELS: RiskLevelMeta[] = [
  { id: 1, name: 'Bajo' },
  { id: 2, name: 'Medio' },
  { id: 3, name: 'Alto' },
]

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
