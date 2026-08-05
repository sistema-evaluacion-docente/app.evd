import { create } from 'zustand'

import type { AcademicPeriod } from '../types'

interface AcademicPeriodsState {
  periods: AcademicPeriod[]
  setPeriods: (periods: AcademicPeriod[]) => void
}

/**
 * Stores the cached academic periods loaded by `useGetAcademicPeriods`
 * so they can be consumed by any component without re-fetching.
 *
 * @example
 * const periods = useAcademicPeriodsStore((s) => s.periods)
 */
export const useAcademicPeriodsStore = create<AcademicPeriodsState>((set) => ({
  periods: [],
  setPeriods: (periods) => set({ periods }),
}))
