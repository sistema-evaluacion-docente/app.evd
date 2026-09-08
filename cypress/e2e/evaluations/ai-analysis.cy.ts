/**
 * RF — El sistema debe clasificar cada comentario por nivel de riesgo y por
 * categoría pedagógica mediante modelos de HuggingFace ejecutados de forma
 * local. Flujo: dar clic en "Analizar" (el botón junto a "Análisis con IA",
 * el mismo disparador que "Analizar con IA" en el listado de evaluaciones) y
 * comprobar que los comentarios de esa evaluación quedan con nivel de riesgo
 * y categorías pedagógicas.
 *
 * `POST /evaluations/{id}/analyze` (`api/utils/ai_analyzer.py` en `api.evd`)
 * corre dos pipelines de `transformers` cargados una sola vez y reutilizados
 * — modelos locales, no una llamada a un servicio externo — como tarea de
 * fondo (`BackgroundTasks`, igual que el procesamiento del PDF), reportando
 * progreso por el mismo canal WebSocket (`stage: "ANALYZING"`) que ya usa la
 * subida. Por eso el clic se da en `EvaluationDetailPage`, que conecta ese
 * canal antes de disparar el análisis: la app misma invalida la consulta y
 * refresca el badge sola cuando el análisis termina, sin que la prueba tenga
 * que sondear la API a mano.
 *
 * Da de alta, por API, una directora nueva — igual que `upload.cy.ts` y
 * `pdf-extraction.cy.ts` — en vez de reutilizar una existente: no depende de
 * que otro spec de `evaluations/` haya corrido antes y dejado residuo, lo que
 * importa porque este archivo es alfabéticamente el primero del directorio y
 * en una corrida completa desde cero sería el primero en necesitarlo.
 *
 * La subida del PDF (paso previo, ya cubierto por `upload.cy.ts`) se hace por
 * API con el mismo `cy.task('uploadMultipart', ...)` que usa
 * `pdf-extraction.cy.ts`, para no repetir esa prueba — aquí interesa lo que
 * pasa después de que la evaluación ya está `COMPLETED`. Mismo departamento
 * fijo `99` y mismo residuo entre corridas (profesores/cursos/grupos que el
 * procesamiento del PDF deja y no se pueden borrar en bloque) que documentan
 * `upload.cy.ts` y `pdf-extraction.cy.ts`; esta prueba solo limpia la
 * evaluación que ella misma crea y la asignación de director.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-analisis-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const MAX_POLL_ATTEMPTS = 20

/** Contraseña que usa cada spec de este repo para las cuentas de director
 * desechables que crea (`upload.cy.ts`, `pdf-extraction.cy.ts`, ...) — no es
 * un secreto real, son cuentas de prueba jamás pensadas para producción. */
const THROWAWAY_PASSWORD = 'Prueba-e2e-1!'

interface EvaluationOut {
  id: number
  academic_period_id: number
  department_id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

interface DirectorAccount {
  uid: string
  email: string
  id: number
}

/** Busca el departamento de código `99` que exige el PDF; lo crea si nadie lo
 * ha hecho todavía (igual que `upload.cy.ts`). Incluye si ya tiene director —
 * desasignar cuando no hay ninguno responde `404`, no un no-op. */
function findOrCreateFixtureDepartment(): Cypress.Chainable<{ id: number; hasDirector: boolean }> {
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

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento (igual que `upload.cy.ts` y
 * `pdf-extraction.cy.ts`). */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}@ufps.edu.co`

  return cy
    .request<{ localId: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email, password: THROWAWAY_PASSWORD, returnSecureToken: true },
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

          return { uid, email, id }
        })
    })
}

/** Sondea `GET /evaluations/{id}` hasta que el procesamiento del PDF termina.
 * Igual que en `pdf-extraction.cy.ts`: sin retry-ability nativo para
 * `cy.request`, hasta veinte intentos con un segundo de espera entre cada
 * uno, más que de sobra para un PDF que en el servidor real termina en menos
 * de un segundo. */
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

let fixtureDepartment: { id: number }
let director: DirectorAccount
let createdEvaluationId: number | undefined

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount().then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
    })
  })
})

after(() => {
  // Solo la directora del departamento de la evaluación puede borrarla, igual
  // que en `upload.cy.ts` y `pdf-extraction.cy.ts`.
  if (createdEvaluationId != null) {
    cy.apiAs(director.email, THROWAWAY_PASSWORD, 'DELETE', `/evaluations/${createdEvaluationId}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Clasificación de comentarios por IA (riesgo y categoría pedagógica)', () => {
  it('analiza los comentarios al hacer clic en "Analizar" y quedan con nivel de riesgo y categoría', () => {
    tokenFor(director.email, THROWAWAY_PASSWORD)
      .then((token) =>
        cy.task('uploadMultipart', {
          url: apiUrl('/evaluations/upload'),
          token,
          files: [{ filename: '2025-1.pdf', path: FIXTURE }],
        }),
      )
      .then((result) => {
        const { status, body } = result as { status: number; body: { data: EvaluationOut } }

        expect(status).to.eq(202)
        createdEvaluationId = body.data.id

        waitForProcessedEvaluation(createdEvaluationId).then((evaluation) => {
          cy.visitApp(`/evaluaciones/${evaluation.id}`)
          cy.loginWithEmail(director.email, THROWAWAY_PASSWORD)
          cy.location('pathname').should('eq', `/evaluaciones/${evaluation.id}`)

          // Antes de analizar: pendiente, y el botón para dispararlo está ahí.
          cy.contains('p', 'Análisis con IA')
            .parent()
            .should('contain.text', 'Pendiente')
            .find('button')
            .should('contain.text', 'Analizar')
            .click()

          // El análisis corre en segundo plano y reporta por WebSocket, como
          // la subida del PDF: la app invalida la consulta sola cuando
          // termina, así que basta con esperar a que el badge cambie — sin
          // sondear la API a mano. Modelos locales de HuggingFace corriendo
          // sobre todos los comentarios de un PDF real pueden tardar; el
          // timeout es generoso a propósito.
          cy.contains('p', 'Análisis con IA', { timeout: 500_000 })
            .parent()
            .should('contain.text', 'Completado')

          // Lo que produjo el análisis: cada comentario de la evaluación
          // clasificado con nivel de riesgo y al menos una categoría
          // pedagógica, y el modelo local que lo hizo — no un valor fijo ni
          // un servicio externo.
          cy.api('GET', `/evaluations/period/${evaluation.academic_period_id}/teachers`).then(
            (teachersResponse) => {
              const teachers = (teachersResponse.body as { data: Array<{ teacher_id: number }> })
                .data
              expect(teachers.length).to.be.greaterThan(0)

              const [teacher] = teachers

              cy.api(
                'GET',
                `/evaluations/${createdEvaluationId}/teachers/${teacher.teacher_id}/comments`,
              ).then((commentsResponse) => {
                const commentsData = (
                  commentsResponse.body as {
                    data: {
                      ai_status: string
                      courses: Array<{
                        comments: Array<{
                          risk_level: { name: string } | null
                          risk_score: number | null
                          risk_level_ai_model: string | null
                          pedagogical_categories: Array<{ name: string; score: number }>
                          pedagogical_category_ai_model: string | null
                        }>
                      }>
                    }
                  }
                ).data

                expect(commentsData.ai_status).to.eq('ANALYZED')

                const comments = commentsData.courses.flatMap((course) => course.comments)
                expect(comments.length).to.be.greaterThan(0)

                comments.forEach((comment) => {
                  expect(comment.risk_level, 'nivel de riesgo').to.not.equal(null)
                  expect(comment.risk_score).to.be.a('number')
                  expect(comment.risk_level_ai_model, 'modelo de riesgo').to.be.a('string')
                })

                // Al menos un comentario cae en alguna categoría pedagógica
                // (el umbral de confianza puede dejar algún comentario sin
                // ninguna, pero no todos): confirma que el segundo modelo
                // también corrió, no solo el de riesgo.
                const withCategory = comments.filter((c) => c.pedagogical_categories.length > 0)
                expect(withCategory.length).to.be.greaterThan(0)
                expect(withCategory[0].pedagogical_category_ai_model).to.be.a('string')
              })
            },
          )
        })
      })
  })
})
