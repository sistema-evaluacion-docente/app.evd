/**
 * RF — El sistema debe listar como alertas los comentarios de riesgo alto
 * asociados a un docente.
 *
 * "Alertas" es `/alertas` (y `/alertas/:teacherId`, para un docente
 * concreto): la misma pantalla y el mismo `GET /comments/` que
 * `/comentarios` (ver `evaluations/comments.cy.ts`), pero con el nivel de
 * riesgo fijado a `ALTO` (`AlertsPage` pasa `riskLevel={3}` a `CommentsList`,
 * que entonces oculta el filtro "Nivel de riesgo" — ya no es el lector quien
 * elige). "Asociados a un docente" es la ruta `/alertas/:teacherId`, que
 * además fija `teacher_id` — la intersección de los dos filtros es el RF.
 *
 * No hace falta correr el análisis de IA (varios minutos, ver
 * `ai-analysis.cy.ts`) para poblar comentarios de riesgo alto: la corrección
 * manual del director (`PATCH /comments/{id}`, ver
 * `comment-classification.cy.ts`) clasifica un comentario recién extraído
 * del PDF exactamente igual que lo haría la IA, así que el fixture usa esa
 * vía, mucho más rápida, para preparar un comentario en `ALTO` de un docente
 * y otro en `BAJO` de otro — la prueba necesita ambos para comprobar que la
 * lista de alertas de verdad discrimina por nivel, no que solo excluye lo
 * que aún no se clasificó.
 *
 * Verificado contra el servidor real antes de escribir esta prueba: no
 * apareció ningún bug, `GET /comments/?risk_level=3&teacher_id=...` ya
 * discrimina exactamente así.
 *
 * El fixture es el mismo PDF real que usan `upload.cy.ts` y
 * `evaluations/comments.cy.ts` (departamento fijo `99`, periodo `2025-2`),
 * subido por un director recién creado. Mismo residuo entre corridas que
 * esos specs (profesores/cursos/grupos que el procesamiento deja); esta
 * prueba solo limpia la evaluación que ella misma crea y la cuenta de
 * director.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-alertas-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const MAX_POLL_ATTEMPTS = 20
const THROWAWAY_PASSWORD = 'Prueba-e2e-1!'
const HIGH_RISK_LEVEL = 3
const LOW_RISK_LEVEL = 1

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

interface EvaluationOut {
  id: number
  academic_period_id: number
  academic_period_code: string
  department_id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

interface TeacherListItem {
  teacher_id: number
  name: string
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento. */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}@ufps.edu.co`
  const password = THROWAWAY_PASSWORD

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

/** Busca el departamento de código `99` que exige el PDF; lo crea si nadie lo
 * ha hecho todavía (igual que `upload.cy.ts` y `pdf-extraction.cy.ts`). */
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

/** Sondea `GET /evaluations/{id}` hasta que el procesamiento del PDF termina. */
function waitForProcessedEvaluation(
  evaluationId: number,
  attempt = 0,
): Cypress.Chainable<EvaluationOut> {
  return cy
    .apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluationId}`)
    .then((response) => {
      const ev = (response.body as { data: EvaluationOut }).data

      if (ev.status === 'COMPLETED') return cy.wrap(ev)
      if (ev.status === 'FAILED') {
        throw new Error(`El procesamiento del PDF falló para la evaluación ${evaluationId}.`)
      }
      if (attempt >= MAX_POLL_ATTEMPTS) {
        throw new Error(
          `La evaluación ${evaluationId} sigue en "${ev.status}" tras ${MAX_POLL_ATTEMPTS} intentos.`,
        )
      }

      cy.wait(1000)

      return waitForProcessedEvaluation(evaluationId, attempt + 1)
    })
}

/** Clasifica manualmente el primer comentario de un docente con un nivel de
 * riesgo dado (`PATCH /comments/{id}`) — el mismo mecanismo que
 * `comment-classification.cy.ts`, aquí usado solo para poblar el fixture. */
function classifyFirstComment(
  teacherId: number,
  academicPeriodId: number,
  riskLevel: number,
): Cypress.Chainable<number> {
  return cy
    .apiAs(
      owner.email,
      owner.password,
      'GET',
      `/comments/?academic_period_id=${academicPeriodId}&teacher_id=${teacherId}&limit=1`,
    )
    .then((response) => {
      const [comment] = (response.body as { data: Array<{ id: number }> }).data

      return cy
        .apiAs(owner.email, owner.password, 'PATCH', `/comments/${comment.id}`, {
          risk_level: riskLevel,
        })
        .then(() => comment.id)
    })
}

let fixtureDepartment: { id: number }
let owner: DirectorAccount
let evaluation: EvaluationOut
let highRiskTeacher: TeacherListItem
let lowRiskTeacher: TeacherListItem
let highRiskCommentId: number
let lowRiskCommentId: number

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount().then((account) => {
      owner = account

      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id }).then(
        () => {
          tokenFor(owner.email, owner.password).then((token) => {
            cy.task('uploadMultipart', {
              url: apiUrl('/evaluations/upload'),
              token,
              files: [{ filename: '2025-1.pdf', path: FIXTURE }],
            }).then((result) => {
              const { body } = result as { status: number; body: { data: EvaluationOut } }

              waitForProcessedEvaluation(body.data.id).then((ev) => {
                evaluation = ev

                cy.apiAs(
                  owner.email,
                  owner.password,
                  'GET',
                  `/evaluations/period/${ev.academic_period_id}/teachers`,
                ).then((teachersResponse) => {
                  const teachers = (teachersResponse.body as { data: TeacherListItem[] }).data
                  ;[highRiskTeacher, lowRiskTeacher] = teachers

                  classifyFirstComment(
                    highRiskTeacher.teacher_id,
                    ev.academic_period_id,
                    HIGH_RISK_LEVEL,
                  ).then((id) => {
                    highRiskCommentId = id
                  })

                  classifyFirstComment(
                    lowRiskTeacher.teacher_id,
                    ev.academic_period_id,
                    LOW_RISK_LEVEL,
                  ).then((id) => {
                    lowRiskCommentId = id
                  })
                })
              })
            })
          })
        },
      )
    })
  })
})

after(() => {
  if (evaluation) {
    cy.apiAs(owner.email, owner.password, 'DELETE', `/evaluations/${evaluation.id}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${owner.uid}/status`, { active: false })
})

describe('Alertas: comentarios de riesgo alto, en general y por docente', () => {
  it('/alertas lista el comentario de riesgo alto y no el de riesgo bajo, sin importar el docente', () => {
    cy.visitApp(`/alertas?period=${evaluation.academic_period_code}`, 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(owner.email, owner.password)
    cy.location('pathname').should('eq', '/alertas')

    cy.get(`article#${highRiskCommentId}`, { timeout: 15000 }).should('contain.text', 'ALTO')
    cy.get(`article#${lowRiskCommentId}`).should('not.exist')
  })

  it('/alertas/:teacherId acota las alertas a ese docente: las suyas de riesgo alto, ninguna de otro', () => {
    // El docente con el comentario de riesgo alto: aparece.
    cy.visitApp(
      `/alertas/${highRiskTeacher.teacher_id}?period=${evaluation.academic_period_code}`,
      'DIRECTOR DE DEPARTAMENTO',
    )
    cy.loginWithEmail(owner.email, owner.password)
    cy.location('pathname').should('eq', `/alertas/${highRiskTeacher.teacher_id}`)

    cy.get(`article#${highRiskCommentId}`, { timeout: 15000 }).should('be.visible')

    // El docente cuyo único comentario clasificado es de riesgo bajo: sin
    // alertas, con el mensaje vacío propio de esta pantalla.
    cy.visit(`/alertas/${lowRiskTeacher.teacher_id}?period=${evaluation.academic_period_code}`)
    cy.location('pathname').should('eq', `/alertas/${lowRiskTeacher.teacher_id}`)

    cy.contains('No hay comentarios de riesgo alto que coincidan con los filtros aplicados.', {
      timeout: 15000,
    }).should('be.visible')
    cy.get('article').should('not.exist')
  })
})
