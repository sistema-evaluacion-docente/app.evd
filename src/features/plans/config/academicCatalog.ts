/**
 * Faculties and academic programs of the UFPS, used to suggest the header of
 * the official improvement-plan forms (FACULTAD / DEPARTAMENTO ACADÉMICO /
 * PROGRAMA ACADÉMICO).
 *
 * It is a catalogue, not a constraint: the three fields are free text on the
 * API, so a director can always type a program that isn't listed here yet.
 * Departments are not modelled apart because at UFPS the department of a
 * teacher is named after the program it serves ("Ingeniería de Sistemas").
 */

export interface AcademicFaculty {
  name: string
  /** Undergraduate, technology and graduate programs, in that order. */
  programs: string[]
}

export const ACADEMIC_FACULTIES: AcademicFaculty[] = [
  {
    name: 'Ingeniería',
    programs: [
      'Arquitectura',
      'Ingeniería Civil',
      'Ingeniería de Minas',
      'Ingeniería de Sistemas',
      'Ingeniería Electromecánica',
      'Ingeniería Electrónica',
      'Ingeniería Industrial',
      'Ingeniería Mecánica',
      'Tecnología en Obras Civiles',
      'Tecnología en Procesos Industriales',
      'Tecnología en Construcciones Civiles (distancia)',
      'Tecnología en Analítica de Datos (virtual)',
      'Especialización en Estructuras',
      'Maestría en Ingeniería de Recursos Hidráulicos',
    ],
  },
  {
    name: 'Ciencias Agrarias y del Ambiente',
    programs: [
      'Ingeniería Agroindustrial',
      'Ingeniería Agronómica',
      'Ingeniería Ambiental',
      'Ingeniería Biotecnológica',
      'Zootecnia',
      'Maestría en Ciencias Biológicas',
    ],
  },
  {
    name: 'Ciencias Básicas',
    programs: [
      'Química Industrial',
      'Licenciatura en Matemáticas',
      'Maestría en Educación Matemática',
      'Doctorado en Educación Matemática',
    ],
  },
  {
    name: 'Ciencias Empresariales',
    programs: [
      'Administración de Empresas',
      'Comercio Internacional',
      'Contaduría Pública',
      'Administración Financiera (distancia)',
      'Especialización en Logística y Negocios Internacionales',
      'Maestría en Gerencia de Empresas',
      'Maestría en Negocios Internacionales',
    ],
  },
  {
    name: 'Ciencias de la Salud',
    programs: [
      'Enfermería',
      'Seguridad y Salud en el Trabajo',
      'Tecnología en Regencia de Farmacia (distancia)',
      'Especialización en Gerencia y Auditoría de la Calidad en Salud',
      'Especialización en Gestión de la Seguridad y la Salud en el Trabajo',
    ],
  },
  {
    name: 'Educación, Artes y Humanidades',
    programs: [
      'Comunicación Social',
      'Derecho',
      'Trabajo Social',
      'Licenciatura en Ciencias Naturales y Educación Ambiental',
      'Licenciatura en Educación Infantil',
      'Licenciatura en Educación Comunitaria (distancia)',
      'Especialización en Educación, Emprendimiento y Economía Solidaria',
      'Especialización en Práctica Pedagógica',
      'Especialización en Educación para la Atención a Población Afectada por el Conflicto Armado',
      'Maestría en Práctica Pedagógica',
      'Maestría en Estudios Sociales y Educación para la Paz',
      'Maestría en TIC aplicadas a la Educación (virtual)',
      'Maestría en Derecho Público: Gobierno, Justicia y Derechos Humanos',
      'Doctorado en Educación',
    ],
  },
]

export const FACULTY_NAMES: string[] = ACADEMIC_FACULTIES.map((faculty) => faculty.name)

export const PROGRAM_NAMES: string[] = [
  ...new Set(ACADEMIC_FACULTIES.flatMap((faculty) => faculty.programs)),
]

/** Lowercased and stripped of accents, so "Ingenieria" finds "Ingeniería". */
function normalize(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * The faculty a program (or a department named after it) belongs to.
 *
 * @example
 * facultyOfProgram('Ingeniería de Sistemas')?.name // 'Ingeniería'
 */
export function facultyOfProgram(program?: string | null): AcademicFaculty | undefined {
  const target = normalize(program)

  if (!target) return undefined

  return ACADEMIC_FACULTIES.find((faculty) =>
    faculty.programs.some((entry) => normalize(entry) === target),
  )
}

/** Programs of a faculty; every program when the faculty is off-catalogue. */
export function programsOfFaculty(faculty?: string | null): string[] {
  const target = normalize(faculty)
  const match = ACADEMIC_FACULTIES.find((entry) => normalize(entry.name) === target)

  return match?.programs ?? PROGRAM_NAMES
}
