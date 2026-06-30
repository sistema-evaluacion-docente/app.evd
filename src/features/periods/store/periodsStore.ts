import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Period } from "../types/Period";

interface PeriodsState {
  selectedPeriod: Period | null;
  setSelectedPeriod: (period: Period | null) => void;
}

export const usePeriodsStore = create<PeriodsState>()(
  persist(
    (set) => ({
      selectedPeriod: null,
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),
    }),
    { name: "periods-storage" },
  ),
);
