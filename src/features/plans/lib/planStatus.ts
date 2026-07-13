import type { PlanStatus } from "../types/Plan";

export interface StatusMeta {
  label: string;
  bar: string;
  text: string;
  bg: string;
  border: string;
}

// The `bar` colors are saturated 500/600 steps and read correctly on either
// theme. The tint/text/border steps are light-only, so each carries a `dark:`
// counterpart. `ink-*` already flips with the theme and needs none.
export const PLAN_STATUS_META: Record<PlanStatus, StatusMeta> = {
  BORRADOR: {
    label: "Borrador",
    bar: "bg-ink-400",
    text: "text-ink-600",
    bg: "bg-ink-50",
    border: "border-ink-200/70",
  },
  EN_SEGUIMIENTO: {
    label: "En Seguimiento",
    bar: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-500/15",
    border: "border-sky-200/70 dark:border-sky-400/30",
  },
  RESULTADO_DISPONIBLE: {
    label: "Resultado Disponible",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    border: "border-amber-200/70 dark:border-amber-400/30",
  },
  CERRADO_CUMPLIDO: {
    label: "Cerrado · Cumplió",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-200/70 dark:border-emerald-400/30",
  },
  CERRADO_NO_CUMPLIDO: {
    label: "Cerrado · No cumplió",
    bar: "bg-brand-600",
    text: "text-brand-700 dark:text-brand-300",
    bg: "bg-brand-50 dark:bg-brand-500/15",
    border: "border-brand-200/70 dark:border-brand-400/30",
  },
  CERRADO_MANUAL: {
    label: "Cerrado · Manual",
    bar: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    border: "border-violet-200/70 dark:border-violet-400/30",
  },
};

export const PLAN_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "EN_SEGUIMIENTO", label: "En Seguimiento" },
  { value: "RESULTADO_DISPONIBLE", label: "Resultado Disponible" },
  { value: "CERRADO_CUMPLIDO", label: "Cumplidos" },
  { value: "CERRADO_NO_CUMPLIDO", label: "No cumplidos" },
  { value: "CERRADO_MANUAL", label: "Cierre manual" },
];

export const TARGET_TYPE_LABEL: Record<string, string> = {
  DIMENSION: "Dimensión",
  PEDAGOGICAL_CATEGORY: "Categoría",
  OVERALL_AVERAGE: "Promedio general",
  QUALITATIVE: "Cualitativo",
};

export function statusMeta(status: PlanStatus): StatusMeta {
  return PLAN_STATUS_META[status] ?? PLAN_STATUS_META.EN_SEGUIMIENTO;
}

export function isClosed(status: PlanStatus): boolean {
  return status.startsWith("CERRADO_");
}
