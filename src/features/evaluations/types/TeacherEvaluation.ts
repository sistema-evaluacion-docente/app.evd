import type { QuestionDetail } from "./Question";

export interface TeacherRankItem {
  rank: number;
  teacher_id: number;
  institutional_code: string;
  name: string | null;
  contract_type: string | null;
  group_count: number;
  overall_average: number | null;
}

export interface EvaluationSummary {
  evaluation_id: number;
  period_code: string | null;
  period_name: string | null;
  department_average: number | null;
  teacher_count: number;
  best_teacher: TeacherRankItem | null;
  worst_teacher: TeacherRankItem | null;
  ranking: TeacherRankItem[];
}

export interface EvaluationDimensionScore {
  dimension: string;
  average: number;
  questions?: QuestionDetail[];
}

export interface EvaluationDimensionAverage {
  dimension: string;
  average: number | null;
  question_count: number;
  questions: { code: string; text: string; score: number }[];
}

export interface TeacherCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  respondent_count: number;
  overall_average: number;
  dimensions: EvaluationDimensionScore[];
}

export interface TeacherCommentCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  comments: string[];
}

export interface TeacherCommentsData {
  teacher_id: number;
  evaluation_id: number;
  courses: TeacherCommentCourse[];
}

export interface TeacherEvaluationDetail {
  teacher_id: number;
  institutional_code: string;
  name: string;
  contract_type: string;
  evaluation_id: number;
  period_code: string;
  period_name: string;
  overall_average: number;
  group_count: number;
  courses: TeacherCourse[];
  dimensions: EvaluationDimensionScore[];
}
