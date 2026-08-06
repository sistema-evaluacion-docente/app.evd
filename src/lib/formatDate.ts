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

export default formatDate
