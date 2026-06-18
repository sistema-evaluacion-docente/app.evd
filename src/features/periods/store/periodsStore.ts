import { create } from "zustand";
import type { Period } from "../types/Period";

interface PeriodsState {
  selectedPeriod: Period | null;
  setSelectedPeriod: (period: Period | null) => void;
}

export const usePeriodsStore = create<PeriodsState>((set) => ({
  selectedPeriod: null,
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
}));
