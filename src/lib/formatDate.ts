import dayjs from 'dayjs'
import localeEs from 'dayjs/locale/es'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.locale(localeEs)

/**
 * Formats a date string into a human-readable format.
 * @param value - The date string to format.
 * @param pattern - dayjs pattern; defaults to the long "MMMM D, YYYY h:mm A".
 * @returns The formatted date, or an em dash when the value is missing or not
 * a valid date.
 */
function formatDate(value?: string | null, pattern = 'MMMM D, YYYY h:mm A') {
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
