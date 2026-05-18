/**
 * UFPS teacher-evaluation matrix: 22 items grouped into 4 dimensions,
 * answered by students for assigned groups (in-person programs).
 */

export interface EvaluationItem {
  code: string
  label: string
}

export interface EvaluationDimension {
  id: 'desarrollo' | 'desempeno' | 'procesos' | 'integracion'
  label: string
  /** Hex accent color used in charts and badges. */
  color: string
  items: EvaluationItem[]
}

export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
  {
    id: 'desarrollo',
    label: 'Desarrollo del Conocimiento',
    color: '#0EA5E9',
    items: [
      { code: '001', label: 'Da a conocer la programación al inicio del semestre' },
      { code: '002', label: 'Demuestra dominio de los temas tratados' },
      { code: '003', label: 'Da respuestas satisfactorias a las preguntas' },
      { code: '004', label: 'Relaciona situaciones problemáticas de la vida real' },
      { code: '005', label: 'Tiene facilidad para expresar sus ideas' },
      { code: '006', label: 'Genera interés por la investigación' },
    ],
  },
  {
    id: 'desempeno',
    label: 'Desempeño Docente',
    color: '#10B981',
    items: [
      { code: '007', label: 'Planea las actividades académicas a desarrollar' },
      { code: '008', label: 'Fomenta la participación en clase' },
      { code: '009', label: 'Aplica metodologías de acuerdo con las necesidades del contenido del curso' },
      { code: '010', label: 'Es ordenado en la presentación de la clase' },
      { code: '011', label: 'Asiste puntualmente a clase' },
      { code: '012', label: 'Realiza actividades de asesoría' },
      { code: '013', label: 'Aporta información bibliográfica con relación a la temática' },
      { code: '014', label: 'Despierta motivación en su clase' },
    ],
  },
  {
    id: 'procesos',
    label: 'Procesos de Evaluación',
    color: '#8B5CF6',
    items: [
      { code: '015', label: 'Los temas de evaluación concuerdan con el contenido del curso' },
      { code: '016', label: 'Establece criterios de evaluación' },
      { code: '017', label: 'Da a conocer el resultado de las evaluaciones oportunamente' },
      { code: '018', label: 'Planea la reflexión sobre los resultados académicos del estudiante' },
    ],
  },
  {
    id: 'integracion',
    label: 'Integración Interpersonal',
    color: '#F59E0B',
    items: [
      { code: '019', label: 'Se muestra abierto al diálogo' },
      { code: '020', label: 'Su actitud refleja identidad institucional' },
      { code: '021', label: 'Establece relaciones de respeto con los estudiantes' },
      { code: '022', label: 'Considera los problemas sociales del estudiante' },
    ],
  },
]

/** Mock per-item scores: individual teacher vs. department average (0–5). */
export const ITEM_SCORES: Record<string, { individual: number; department: number }> = {
  '001': { individual: 4.6, department: 4.2 },
  '002': { individual: 4.8, department: 4.4 },
  '003': { individual: 4.5, department: 4.1 },
  '004': { individual: 4.3, department: 3.9 },
  '005': { individual: 4.7, department: 4.3 },
  '006': { individual: 4.0, department: 3.7 },
  '007': { individual: 4.5, department: 4.2 },
  '008': { individual: 4.4, department: 4.0 },
  '009': { individual: 4.6, department: 4.1 },
  '010': { individual: 4.5, department: 4.2 },
  '011': { individual: 4.9, department: 4.6 },
  '012': { individual: 4.2, department: 3.8 },
  '013': { individual: 4.3, department: 3.9 },
  '014': { individual: 4.4, department: 4.0 },
  '015': { individual: 4.7, department: 4.3 },
  '016': { individual: 4.6, department: 4.1 },
  '017': { individual: 4.0, department: 3.6 },
  '018': { individual: 4.1, department: 3.7 },
  '019': { individual: 4.8, department: 4.4 },
  '020': { individual: 4.6, department: 4.5 },
  '021': { individual: 4.9, department: 4.7 },
  '022': { individual: 4.4, department: 4.1 },
}
