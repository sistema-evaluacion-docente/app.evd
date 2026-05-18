const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

/** Extract up-to-two-letter initials, stripping academic titles. */
export function initialsOf(name: string): string {
  const parts = name
    .replace(/^(Dra?\.|Lic\.|Ing\.|Mg\.|Mtra?\.|Prof\.)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

/** Stable string hash, used to pick a deterministic avatar palette. */
export function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Format an ISO date to `dd mmm yyyy` in Spanish. */
export function formatDateEs(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  const day = String(date.getDate()).padStart(2, '0')
  return `${day} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`
}

/** Format an ISO datetime into separate `date` / `time` parts (es-CO). */
export function formatDateTimeEs(iso: string): { date: string; time: string; iso: string } {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return {
    date: `${day} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`,
    time: `${hh}:${mm}:${ss}`,
    iso,
  }
}

/** Whole days between two dates. */
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}
