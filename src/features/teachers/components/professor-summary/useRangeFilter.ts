import { useMemo, useState } from 'react'

import type { RangeValue } from './RangeSelect'

/**
 * Hook to filter a list of data based on a range value.
 *
 * @param data - The list of data to filter.
 * @returns An object containing the current range value, a function to set the range value, and the filtered list of visible data.
 */
export function useRangeFilter<T>(data: T[]) {
  const [range, setRange] = useState<RangeValue>('all')

  const visible = useMemo(
    () => (range === 'all' ? data : data.slice(-Number(range))),
    [data, range],
  )

  return { range, setRange, visible }
}
