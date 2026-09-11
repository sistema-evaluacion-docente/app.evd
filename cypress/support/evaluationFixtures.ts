/**
 * Sube por API los dos PDFs reales de prueba del departamento `99`
 * (anonimizados, `cypress/files/prueba-2025-2.pdf` y `prueba-2026-1.pdf`) —
 * mismo criterio que `evaluations/upload.cy.ts` y `pdf-extraction.cy.ts` ya
 * usan para el PDF real de ese mismo departamento: el código no se puede
 * aleatorizar (viene impreso en el PDF), así que el departamento se busca o
 * se crea, y solo lo que cada spec sube se limpia al terminar — los
 * profesores, cursos y grupos que deja el procesamiento no se pueden borrar
 * en bloque.
 */

import { apiUrl, tokenFor } from './commands'

const MAX_POLL_ATTEMPTS = 20

export interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

export interface EvaluationOut {
  id: number
  academic_period_id: number
  academic_period_code: string
  department_id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento. */
export function createDirectorAccount(label: string): Cypress.Chainable<DirectorAccount> {
  const marca = `e2e-reports-${Date.now()}-${label}`
  const email = `${marca}@ufps.edu.co`
  const password = 'Prueba-e2e-1!'

  return cy
    .request<{ localId: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email, password, returnSecureToken: true },
    })
    .then((signUp) => {
      const uid = signUp.body.localId

      return cy
        .api('POST', '/users/', {
          uid,
          email,
          name: `Director de prueba ${marca}`,
          active: true,
          avatar_url: '',
          institutional_code: marca,
          contract_type: 'Tiempo completo',
          roles: ['DIRECTOR DE DEPARTAMENTO'],
        })
        .then((response) => {
          const id = (response.body as { data: { id: number } }).data.id

          return { uid, email, password, id }
        })
    })
}

/** Busca el departamento de código `99` que exigen los PDF; lo crea si nadie
 * lo ha hecho todavía. Incluye si ya tiene director — desasignar cuando no
 * hay ninguno responde `404`, no un no-op. */
export function findOrCreateFixtureDepartment(): Cypress.Chainable<{
  id: number
  hasDirector: boolean
}> {
  return cy.api('GET', '/departments/?search=99&limit=10').then((response) => {
    const departments = (
      response.body as { data: Array<{ id: number; code: string; director: unknown }> }
    ).data
    const existing = departments.find((department) => department.code === '99')

    if (existing) return cy.wrap({ id: existing.id, hasDirector: existing.director !== null })

    return cy.api('GET', '/faculties/?limit=1').then((facultyResponse) => {
      const [faculty] = (facultyResponse.body as { data: Array<{ id: number }> }).data

      return cy
        .api('POST', '/departments/', { name: 'Testing', code: '99', faculty_id: faculty.id })
        .then((created) => ({
          id: (created.body as { data: { id: number } }).data.id,
          hasDirector: false,
        }))
    })
  })
}

/** Sondea `GET /evaluations/{id}` hasta que el procesamiento del PDF termina. */
function waitForProcessedEvaluation(
  evaluationId: number,
  attempt = 0,
): Cypress.Chainable<EvaluationOut> {
  return cy.api('GET', `/evaluations/${evaluationId}`).then((response) => {
    const evaluation = (response.body as { data: EvaluationOut }).data

    if (evaluation.status === 'COMPLETED') return cy.wrap(evaluation)
    if (evaluation.status === 'FAILED') {
      throw new Error(`El procesamiento del PDF falló para la evaluación ${evaluationId}.`)
    }
    if (attempt >= MAX_POLL_ATTEMPTS) {
      throw new Error(
        `La evaluación ${evaluationId} sigue en "${evaluation.status}" tras ${MAX_POLL_ATTEMPTS} intentos.`,
      )
    }

    cy.wait(1000)

    return waitForProcessedEvaluation(evaluationId, attempt + 1)
  })
}

/** Sube un PDF de fixture con la cuenta de un director ya asignado al
 * departamento `99`, y espera a que el procesamiento termine de verdad. */
export function uploadFixturePdf(
  director: Pick<DirectorAccount, 'email' | 'password'>,
  fixturePath: string,
): Cypress.Chainable<EvaluationOut> {
  return tokenFor(director.email, director.password).then((token) =>
    cy
      .task('uploadMultipart', {
        url: apiUrl('/evaluations/upload'),
        token,
        files: [{ filename: fixturePath.split('/').pop()!, path: fixturePath }],
      })
      .then((result) => {
        const { body } = result as { status: number; body: { data: EvaluationOut } }

        return waitForProcessedEvaluation(body.data.id)
      }),
  )
}

/**
 * Sube los dos periodos reales del fixture (2025-2 y 2026-1) con un director
 * desechable ya asignado al departamento `99`, y deja resueltos los 3
 * docentes anonimizados por su nombre — evita repetir la búsqueda por nombre
 * en cada spec.
 */
export function seedFixtureEvaluations(director: Pick<DirectorAccount, 'email' | 'password'>) {
  return uploadFixturePdf(director, 'cypress/files/prueba-2025-2.pdf').then((eval2025) =>
    uploadFixturePdf(director, 'cypress/files/prueba-2026-1.pdf').then((eval2026) =>
      cy
        .api('GET', `/evaluations/period/${eval2026.academic_period_id}/teachers`)
        .then((response) => {
          const teachers = (
            response.body as { data: Array<{ teacher_id: number; name: string }> }
          ).data

          const byName = (name: string) => {
            const found = teachers.find((teacher) => teacher.name === name)
            if (!found) throw new Error(`No se encontró "${name}" entre los docentes del fixture.`)
            return found.teacher_id
          }

          return {
            eval2025,
            eval2026,
            teacherIds: {
              docente1: byName('DOCENTE 1'),
              docente2: byName('DOCENTE 2'),
              docente3: byName('DOCENTE 3'),
            },
          }
        }),
    ),
  )
}
