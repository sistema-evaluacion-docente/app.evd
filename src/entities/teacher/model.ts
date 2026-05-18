export type Vinculacion =
  | 'Tiempo Completo'
  | 'Catedrático'
  | 'Ocasional'
  | 'Medio Tiempo'

export type TeacherStatus = 'normal' | 'seguimiento' | 'plan_activo'

export type Trend = 'up' | 'down' | 'flat'

export interface Teacher {
  id: number
  name: string
  faculty: string
  vinculacion: Vinculacion
  /** Global score on a 0–100 scale. */
  score: number
  status: TeacherStatus
  trend: Trend
}

export const VINCULACIONES: Vinculacion[] = [
  'Tiempo Completo',
  'Catedrático',
  'Ocasional',
  'Medio Tiempo',
]

export const FACULTIES = [
  'Ciencias Básicas',
  'Ingeniería de Sistemas',
  'Artes y Humanidades',
  'Facultad de Ciencias',
  'Ciencias Económicas',
  'Ciencias Sociales',
  'Educación',
  'Ingeniería Civil',
  'Derecho',
  'Medicina',
]

export const TEACHER_STATUS_BADGE: Record<
  TeacherStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  normal: { label: 'NORMAL', variant: 'success' },
  seguimiento: { label: 'SEGUIMIENTO', variant: 'warning' },
  plan_activo: { label: 'PLAN ACTIVO', variant: 'danger' },
}

export const TEACHERS: Teacher[] = [
  { id: 1, name: 'Dra. Elena Rodríguez', faculty: 'Facultad de Ciencias', vinculacion: 'Tiempo Completo', score: 92.5, status: 'normal', trend: 'up' },
  { id: 2, name: 'Ing. Ricardo Méndez', faculty: 'Ingeniería de Sistemas', vinculacion: 'Catedrático', score: 64.0, status: 'plan_activo', trend: 'down' },
  { id: 3, name: 'Lic. Sofía Valenzuela', faculty: 'Artes y Humanidades', vinculacion: 'Ocasional', score: 78.2, status: 'seguimiento', trend: 'down' },
  { id: 4, name: 'Dr. Carlos Pineda', faculty: 'Ciencias Básicas', vinculacion: 'Tiempo Completo', score: 88.1, status: 'normal', trend: 'up' },
  { id: 5, name: 'Mtra. Lucía Herrera', faculty: 'Educación', vinculacion: 'Medio Tiempo', score: 81.4, status: 'normal', trend: 'up' },
  { id: 6, name: 'Dr. Andrés Cifuentes', faculty: 'Ciencias Económicas', vinculacion: 'Tiempo Completo', score: 75.6, status: 'seguimiento', trend: 'flat' },
  { id: 7, name: 'Ing. Mariana Posada', faculty: 'Ingeniería Civil', vinculacion: 'Catedrático', score: 89.7, status: 'normal', trend: 'up' },
  { id: 8, name: 'Lic. Tomás Aristizábal', faculty: 'Derecho', vinculacion: 'Ocasional', score: 62.8, status: 'plan_activo', trend: 'down' },
  { id: 9, name: 'Dra. Paula Restrepo', faculty: 'Medicina', vinculacion: 'Tiempo Completo', score: 94.2, status: 'normal', trend: 'up' },
  { id: 10, name: 'Prof. Hernán Cárdenas', faculty: 'Ciencias Sociales', vinculacion: 'Medio Tiempo', score: 71.9, status: 'seguimiento', trend: 'flat' },
  { id: 11, name: 'Lic. Daniela Ospina', faculty: 'Artes y Humanidades', vinculacion: 'Catedrático', score: 67.3, status: 'plan_activo', trend: 'down' },
  { id: 12, name: 'Dr. Javier Mosquera', faculty: 'Ciencias Básicas', vinculacion: 'Tiempo Completo', score: 90.8, status: 'normal', trend: 'up' },
  { id: 13, name: 'Ing. Camila Salazar', faculty: 'Ingeniería de Sistemas', vinculacion: 'Tiempo Completo', score: 85.0, status: 'normal', trend: 'up' },
  { id: 14, name: 'Mtra. Rosa Aguilar', faculty: 'Educación', vinculacion: 'Ocasional', score: 79.5, status: 'seguimiento', trend: 'flat' },
  { id: 15, name: 'Dr. Sebastián Vélez', faculty: 'Ciencias Económicas', vinculacion: 'Catedrático', score: 68.9, status: 'plan_activo', trend: 'down' },
  { id: 16, name: 'Lic. Andrea Ramírez', faculty: 'Ciencias Sociales', vinculacion: 'Tiempo Completo', score: 83.6, status: 'normal', trend: 'up' },
]
