import dayjs from 'dayjs'
import localeEs from 'dayjs/locale/es'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.locale(localeEs)

/**
 * Formats a date string into a human-readable format.
 *
 * The default reads the way a date is said in Spanish — "3 de marzo de 2026" —
 * and not "marzo 3, 2026", which is the English order wearing Spanish month
 * names. The whole app is in Spanish, so this is the shape it gets everywhere.
 *
 * @param value - The date string to format.
 * @param pattern - dayjs pattern; defaults to the long "D [de] MMMM [de] YYYY, h:mm A".
 * @returns The formatted date, or an em dash when the value is missing or not
 * a valid date.
 */
function formatDate(value?: string | null, pattern = 'D [de] MMMM [de] YYYY, h:mm A') {
  const date = dayjs(value)

  if (!value || !date.isValid()) return '—'

  return date.format(pattern)
}

/** Today as `YYYY-MM-DD`, the wire format of every date field of the API. */
export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** Whether a `YYYY-MM-DD` date falls before today. Blank values are not past. */
export function isPastDate(value?: string | null): boolean {
  const date = dayjs(value)

  if (!value || !date.isValid()) return false

  return date.isBefore(dayjs(), 'day')
}

export default formatDate
