/**
 * One default improvement action a department offers when a director draws up
 * an improvement plan. Stored inside the `improvement_plan.suggested_actions`
 * setting as an element of a JSON array, so `id` is generated client-side and
 * is the only stable handle a row has.
 */
export interface SuggestedAction {
  /** Client-generated UUID; stable across edits so history stays readable. */
  id: string
  /** One of the five aspects of the official UFPS forms (`GET /improvement-plans/indicators`). */
  aspect: number
  /** What the teacher commits to doing — dropped straight into a commitment. */
  action: string
}
