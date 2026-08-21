/** How a group is taught, in the API's own spelling. */
export type CourseModality = 'PRESENCIAL' | 'DISTANCIA'

/** Every modality with its reading label, in the order they are offered. */
export const MODALITIES: { value: CourseModality; label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'DISTANCIA', label: 'Distancia' },
]

/** Reading label per modality, for badges, filters and messages. */
export const MODALITY_LABEL: Record<CourseModality, string> = {
  PRESENCIAL: 'Presencial',
  DISTANCIA: 'Distancia',
}

/**
 * Reads a modality off a query string, ignoring anything that isn't one — a
 * hand-typed `?modality=VIRTUAL` is dropped rather than forwarded to the API.
 *
 * @example
 * parseModality(searchParams.get('modality')) // 'DISTANCIA' | undefined
 */
export function parseModality(raw: string | null | undefined): CourseModality | undefined {
  const value = raw?.toUpperCase()

  return MODALITIES.find((modality) => modality.value === value)?.value
}
