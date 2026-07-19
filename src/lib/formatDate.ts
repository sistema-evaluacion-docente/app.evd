import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import localeEs from 'dayjs/locale/es'

dayjs.extend(utc)
dayjs.locale(localeEs)

/**
 * Formats a date string into a human-readable format.
 * @param value - The date string to format.
 * @returns A formatted date string in the format "MMMM D, YYYY h:mm A".
 */
function formatDate(value: string) {
  return dayjs(value).format('MMMM D, YYYY h:mm A')
}

export default formatDate
