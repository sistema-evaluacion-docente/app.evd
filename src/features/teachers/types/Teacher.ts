import type { User } from "@/features/auth";

export interface Teacher {
  id: number;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
  user_id?: number;
  user?: User;
  active: boolean;
  overall_average?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherCreatePayload {
  name: string;
  email: string;
  username: string;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
}

export interface UpdateTeacherPayload {
  id: number;
  name: string;
  email: string;
  institutional_code: string;
  department_id?: number;
  contract_type?: string;
  active?: boolean;
}

export interface TeacherHistoryEntry {
  evaluation_id: number;
  period_id: number;
  period_code: string;
  period_name: string;
  overall_average: number;
  group_count: number;
}

export interface TeacherHistoryData {
  teacher_id: number;
  institutional_code: string;
  name: string;
  history: TeacherHistoryEntry[];
}

export interface TeacherSemesterComparisonQuestion {
  code: string;
  text: string;
  current_average: number;
  old_average: number;
  difference: number;
}

export interface TeacherSemesterComparisonDimension {
  dimension: string;
  current_average: number;
  old_average: number;
  difference: number;
  questions: TeacherSemesterComparisonQuestion[];
}

export interface TeacherSemesterComparisonCourse {
  course_code: string;
  course_name: string;
  group_name: string;
  semester: string;
  overall_average: number;
  respondent_count: number;
}

export interface TeacherSemesterComparisonComments {
  semester: string;
  total_comments: number;
  risk_breakdown: Record<string, number>;
}

export interface TeacherSemesterComparisonData {
  teacher_id: number;
  teacher_name: string;
  current_semester: string;
  old_semester: string;
  current_overall_average: number;
  old_overall_average: number;
  average_difference: number;
  current_group_count: number;
  old_group_count: number;
  current_respondent_count: number;
  old_respondent_count: number;
  current_weakest_dimension: string;
  old_weakest_dimension: string;
  current_strongest_dimension: string;
  old_strongest_dimension: string;
  dimensions: TeacherSemesterComparisonDimension[];
  current_courses: TeacherSemesterComparisonCourse[];
  old_courses: TeacherSemesterComparisonCourse[];
  current_comments: TeacherSemesterComparisonComments;
  old_comments: TeacherSemesterComparisonComments;
}
