export interface RecentEvaluation {
  id: number;
  name: string;
  faculty: string;
  type: string;
  score: string;
  scoreColor: "green" | "amber" | "red";
  status: string;
  statusVariant: "success" | "warning" | "danger";
}

export interface PerformanceItem {
  dot: string;
  label: string;
  value: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
