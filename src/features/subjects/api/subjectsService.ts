import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface SubjectAnalytics {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  department_name: string;
  teacher_count: number;
  group_count: number;
  overall_average: number;
  previous_overall_average: number | null;
  total_respondents: number;
  weakest_dimension: string;
  strongest_dimension: string;
}

export interface SubjectTeacherDimension {
  dimension: string;
  average: number;
}

export interface SubjectTeacher {
  teacher_id: number;
  institutional_code: string;
  name: string;
  avatar_url: string | null;
  contract_type: string | null;
  group_count: number;
  overall_average: number;
  dimensions: SubjectTeacherDimension[];
}

export interface SubjectTeachersData {
  course_id: number;
  course_code: string;
  course_name: string;
  academic_period_id: number;
  academic_period_code: string;
  teachers: SubjectTeacher[];
}

export function getSubjects(
  academicPeriodId: number,
  departmentId?: number,
): Promise<ResponseAPI<SubjectAnalytics[]>> {
  return api.get("/stats/subjects", {
    params: {
      academic_period_id: academicPeriodId,
      ...(departmentId ? { department_id: departmentId } : {}),
    },
  });
}

export function getSubjectTeachers(
  courseId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<SubjectTeachersData>> {
  return api.get("/stats/subject-teachers", {
    params: {
      course_id: courseId,
      academic_period_id: academicPeriodId,
    },
  });
}
