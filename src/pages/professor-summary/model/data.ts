export type ProfessorRiskLevel = 'alto' | 'medio' | 'bajo'

export interface ProfessorQuestion {
  code: string
  text: string
  mine: number
  dept: number
}

export interface ProfessorComment {
  id: number
  text: string
  subject: string
  categoryId: string
  categoryName: string
  risk: ProfessorRiskLevel
  confidence: number
}

export interface ProfessorCategory {
  id: string
  name: string
  score: number
  deptScore: number
  questions: ProfessorQuestion[]
  comments: ProfessorComment[]
}

export interface ProfessorLevel {
  label: string
  variant: 'success' | 'warning' | 'danger'
}

export interface ProfessorSummary {
  categories: ProfessorCategory[]
  comments: ProfessorComment[]
  overall: number
  deptOverall: number
  level: ProfessorLevel
}

export interface ProfessorPeriod {
  value: string
  label: string
}

interface RawCategory {
  id: string
  name: string
  questions: [code: string, text: string, mine: number, dept: number][]
}

const CATEGORIES: RawCategory[] = [
  {
    id: 'desempeno',
    name: 'Desempeño Docente',
    questions: [
      ['DD1', 'Explica los contenidos con claridad y en un orden lógico.', 4.6, 4.2],
      ['DD2', 'Demuestra dominio de la asignatura que imparte.', 4.8, 4.4],
      ['DD3', 'Utiliza metodologías que facilitan el aprendizaje.', 4.1, 4.0],
      ['DD4', 'Fomenta la participación de los estudiantes en clase.', 4.3, 4.1],
    ],
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo del Conocimiento',
    questions: [
      ['DC1', 'Relaciona los temas con situaciones reales de la profesión.', 4.2, 4.0],
      ['DC2', 'Promueve el análisis crítico y la investigación.', 3.9, 3.8],
      ['DC3', 'Mantiene actualizados los contenidos del curso.', 4.4, 4.1],
      ['DC4', 'Recomienda bibliografía y recursos pertinentes.', 4.0, 3.9],
    ],
  },
  {
    id: 'procesos',
    name: 'Procesos de Evaluación',
    questions: [
      ['PE1', 'Informa oportunamente los criterios de evaluación.', 4.7, 4.3],
      ['PE2', 'Las evaluaciones corresponden a lo enseñado en clase.', 4.5, 4.2],
      ['PE3', 'Entrega las calificaciones en los plazos establecidos.', 4.2, 4.0],
      ['PE4', 'Retroalimenta los trabajos y exámenes de forma útil.', 3.8, 3.7],
    ],
  },
  {
    id: 'integracion',
    name: 'Integración Interpersonal',
    questions: [
      ['II1', 'Trata a los estudiantes con respeto y cordialidad.', 4.9, 4.6],
      ['II2', 'Está disponible para atender consultas fuera de clase.', 4.4, 4.1],
      ['II3', 'Escucha y responde las inquietudes de los estudiantes.', 4.5, 4.2],
      ['II4', 'Genera un ambiente de confianza en el aula.', 4.6, 4.3],
    ],
  },
]

interface RawComment {
  text: string
  subject: string
  categoryId: string
  risk: ProfessorRiskLevel
  confidence: number
}

const COMMENTS: RawComment[] = [
  { text: 'Las explicaciones son muy claras y siempre está dispuesto a resolver dudas fuera de clase.', subject: 'Arquitectura de Software', categoryId: 'desempeno', risk: 'bajo', confidence: 96 },
  { text: 'Buen manejo del aula y dominio del tema; podría incluir más ejemplos prácticos del sector.', subject: 'Ingeniería de Requisitos', categoryId: 'desarrollo', risk: 'medio', confidence: 88 },
  { text: 'El semestre fue muy denso y faltó organización en las fechas de los entregables.', subject: 'Ética Profesional', categoryId: 'procesos', risk: 'alto', confidence: 91 },
  { text: 'Excelente acompañamiento durante el desarrollo de los proyectos finales.', subject: 'Arquitectura de Software', categoryId: 'integracion', risk: 'bajo', confidence: 97 },
  { text: 'La retroalimentación de los parciales llegó tarde y no fue detallada.', subject: 'Ingeniería de Requisitos', categoryId: 'procesos', risk: 'alto', confidence: 84 },
  { text: 'Siempre responde los correos y atiende en su oficina con buena disposición.', subject: 'Ética Profesional', categoryId: 'integracion', risk: 'bajo', confidence: 95 },
  { text: 'Los contenidos están actualizados y usa artículos recientes en las lecturas.', subject: 'Arquitectura de Software', categoryId: 'desarrollo', risk: 'bajo', confidence: 93 },
  { text: 'Las clases magistrales podrían ser más dinámicas para mantener la atención.', subject: 'Ingeniería de Requisitos', categoryId: 'desempeno', risk: 'medio', confidence: 86 },
]

/** Mock period list; delta shifts every score so each period looks different. */
const PERIODS = [
  { value: '2025-1', delta: 0, commentCount: 8 },
  { value: '2024-2', delta: -0.25, commentCount: 6 },
  { value: '2024-1', delta: -0.4, commentCount: 5 },
]

export const PROFESSOR_PERIODS: ProfessorPeriod[] = PERIODS.map((period) => ({
  value: period.value,
  label: `Periodo ${period.value}`,
}))

export const PROFESSOR_RISK_BADGE: Record<
  ProfessorRiskLevel,
  { label: string; variant: 'danger' | 'warning' | 'success' }
> = {
  alto: { label: 'Alto', variant: 'danger' },
  medio: { label: 'Medio', variant: 'warning' },
  bajo: { label: 'Bajo', variant: 'success' },
}

const clamp = (value: number) => Math.max(0, Math.min(5, value))

export const professorScoreTone = (score: number) =>
  score >= 4.0 ? 'text-emerald-600' : score >= 3.5 ? 'text-amber-600' : 'text-red-600'

function levelFor(overall: number): ProfessorLevel {
  if (overall >= 4.3) return { label: 'Sobresaliente', variant: 'success' }
  if (overall >= 3.8) return { label: 'Destacado', variant: 'success' }
  if (overall >= 3.5) return { label: 'Aceptable', variant: 'warning' }
  return { label: 'Requiere mejora', variant: 'danger' }
}

export function buildProfessorSummary(periodValue: string): ProfessorSummary {
  const period = PERIODS.find((p) => p.value === periodValue) ?? PERIODS[0]

  const comments: ProfessorComment[] = COMMENTS.slice(0, period.commentCount).map(
    (comment, index) => ({
      id: index + 1,
      text: comment.text,
      subject: comment.subject,
      categoryId: comment.categoryId,
      categoryName:
        CATEGORIES.find((category) => category.id === comment.categoryId)?.name ?? '',
      risk: comment.risk,
      confidence: comment.confidence,
    }),
  )

  const categories: ProfessorCategory[] = CATEGORIES.map((category) => {
    const questions: ProfessorQuestion[] = category.questions.map(
      ([code, text, mine, dept]) => ({
        code,
        text,
        mine: clamp(mine + period.delta),
        dept: clamp(dept + period.delta * 0.6),
      }),
    )

    return {
      id: category.id,
      name: category.name,
      score: questions.reduce((sum, q) => sum + q.mine, 0) / questions.length,
      deptScore: questions.reduce((sum, q) => sum + q.dept, 0) / questions.length,
      questions,
      comments: comments.filter((comment) => comment.categoryId === category.id),
    }
  })

  const overall =
    categories.reduce((sum, category) => sum + category.score, 0) / categories.length
  const deptOverall =
    categories.reduce((sum, category) => sum + category.deptScore, 0) / categories.length

  return { categories, comments, overall, deptOverall, level: levelFor(overall) }
}
