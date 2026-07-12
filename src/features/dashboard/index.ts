export { DashboardPage } from "./components/DashboardPage";

export { default as useGetStats } from "./hooks/useGetStats";
export { default as useGetTeacherCount } from "./hooks/useGetTeacherCount";
export { default as useGetTeacherPerformance } from "./hooks/useGetTeacherPerformance";

export type {
  ChartDataPoint,
  PerformanceItem,
  RecentEvaluation,
} from "./types/Dashboard";

export type { StatItem } from "./api/getStats";
export type {
  TeacherPerformanceData,
  TeacherRankItem,
} from "./api/getTeacherPerformance";
