export interface Dimension {
  dimension: string
  average: number | null
  questions: { code: string; text: string; score: number }[]
}
