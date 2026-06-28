export { DashboardPage } from "./components/DashboardPage";

export { default as useGetTeacherCount } from "./hooks/useGetTeacherCount";
export { default as useGetStats } from "./hooks/useGetStats";

export type {
  ChartDataPoint,
  PerformanceItem,
  RecentEvaluation,
} from "./types/Dashboard";

export type { StatItem } from "./api/getStats";
