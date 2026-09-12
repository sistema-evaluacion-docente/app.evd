/**
 * RF — El sistema debe permitir consultar evaluaciones por identificador, por
 * periodo y en listado paginado, junto con su resumen, sus promedios por
 * dimensión y su detalle por dimensión. Solo por el director que tenga
 * asignado ese departamento.
 *
 * Verificado contra el servidor real antes de escribir esta prueba, con dos
 * directores reales de departamentos distintos: de los 6 endpoints que cubre
 * el RF, solo el listado paginado (`GET /evaluations/`, que sustituye en
 * silencio el `department_id` de la consulta por el del director, igual que
 * `GET /teachers/` en `department-isolation.cy.ts`) y el detalle de
 * dimensiones (`GET /evaluations/{id}/dimensions/detail`) aislaban de
 * verdad. Los otros cuatro — por identificador, por periodo, el resumen y
 * los promedios por dimensión — no comprobaban el departamento en absoluto:
 * un director de OTRO departamento recibía `200` con los datos completos de
 * una evaluación ajena. Se corrigió en `api.evd`
 * (`EvaluationService._assert_can_view_department`, la misma comprobación
 * que ya usaba `get_dimension_detail`, aplicada también a `get_by_id`,
 * `get_by_period`, `get_summary` y `get_dimension_averages`), verificado con
 * la suite de `api.evd` (1737 tests) y de nuevo contra el servidor real antes
 * de escribir esta prueba.
 *
 * Como `academic-groups.cy.ts` y `upload.cy.ts` documentan, no hay pantalla
 * propia para el resumen ni para los promedios por dimensión (el frontend no
 * los consume), así que la prueba se queda en la capa de API para los 6
 * endpoints — igual que `department-isolation.cy.ts` hace para el historial
 * de un docente. La evaluación de fixture es un PDF real subido por el
 * director dueño, con departamento fijo `99` (impreso en el PDF, ver
 * `upload.cy.ts`); el director ajeno es de un departamento real distinto,
 * elegido en el momento porque no puede aleatorizarse con `marca`.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-evalaccess-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const MAX_POLL_ATTEMPTS = 20

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

interface EvaluationOut {
  id: number
  academic_period_id: number
  department_id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento (igual que `upload.cy.ts`). */
function createDirectorAccount(label: string): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}-${label}@ufps.edu.co`
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
          name: `Director de prueba ${marca}-${label}`,
          active: true,
          avatar_url: '',
          institutional_code: `${marca}-${label}`,
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
 * ha hecho todavía (igual que `upload.cy.ts` y `pdf-extraction.cy.ts`).
 * Incluye si ya tiene director — desasignar cuando no hay ninguno responde
 * `404`, no un no-op. */
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

/** Un departamento real sin director, distinto del `99` — para el director
 * ajeno (igual que `upload.cy.ts`). */
function findDepartmentWithoutDirector(excludingCode: string): Cypress.Chainable<{ id: number }> {
  return cy.api('GET', '/departments/?page=1&limit=100').then((response) => {
    const departments = (
      response.body as { data: Array<{ id: number; code: string; director: unknown }> }
    ).data

    const candidate = departments.find(
      (department) => department.director === null && department.code !== excludingCode,
    )

    if (!candidate) {
      throw new Error('Se necesita un departamento real sin director, distinto del 99.')
    }

    return { id: candidate.id }
  })
}

/** Sondea `GET /evaluations/{id}` hasta que el procesamiento del PDF termina
 * (igual que `pdf-extraction.cy.ts`). */
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

let fixtureDepartment: { id: number }
let otherDepartment: { id: number }
let owner: DirectorAccount
let outsider: DirectorAccount
let evaluation: EvaluationOut

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    findDepartmentWithoutDirector('99').then((department) => {
      otherDepartment = department

      createDirectorAccount('ajeno').then((account) => {
        outsider = account
        cy.api('POST', `/departments/${otherDepartment.id}/director`, { user_id: account.id })
      })
    })

    createDirectorAccount('dueno').then((account) => {
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
  cy.api('DELETE', `/departments/${otherDepartment.id}/director`)
  cy.api('PATCH', `/users/${owner.uid}/status`, { active: false })
  cy.api('PATCH', `/users/${outsider.uid}/status`, { active: false })
})

describe('Consultar una evaluación: solo el director de su propio departamento', () => {
  it('el director dueño consulta su evaluación por ID, por periodo, en el listado, su resumen, sus promedios y su detalle por dimensión', () => {
    cy.apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluation.id}`)
      .its('status')
      .should('eq', 200)

    cy.apiAs(
      owner.email,
      owner.password,
      'GET',
      `/evaluations/by-period/${evaluation.academic_period_id}`,
    )
      .its('status')
      .should('eq', 200)

    cy.apiAs(owner.email, owner.password, 'GET', '/evaluations/?page=1&limit=10').then(
      (response) => {
        expect(response.status).to.eq(200)
        const items = (response.body as { data: EvaluationOut[] }).data
        expect(items.map((item) => item.id)).to.include(evaluation.id)
      },
    )

    cy.apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluation.id}/summary`)
      .its('status')
      .should('eq', 200)

    cy.apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluation.id}/dimension-averages`)
      .its('status')
      .should('eq', 200)

    cy.apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluation.id}/dimensions/detail`)
      .its('status')
      .should('eq', 200)
  })

  it('un director de otro departamento recibe 403 en los 5 endpoints por ID/periodo, no un 200 con datos ajenos', () => {
    cy.apiAs(outsider.email, outsider.password, 'GET', `/evaluations/${evaluation.id}`)
      .its('status')
      .should('eq', 403)

    cy.apiAs(
      outsider.email,
      outsider.password,
      'GET',
      `/evaluations/by-period/${evaluation.academic_period_id}`,
    )
      .its('status')
      .should('eq', 403)

    cy.apiAs(outsider.email, outsider.password, 'GET', `/evaluations/${evaluation.id}/summary`)
      .its('status')
      .should('eq', 403)

    cy.apiAs(
      outsider.email,
      outsider.password,
      'GET',
      `/evaluations/${evaluation.id}/dimension-averages`,
    )
      .its('status')
      .should('eq', 403)

    cy.apiAs(
      outsider.email,
      outsider.password,
      'GET',
      `/evaluations/${evaluation.id}/dimensions/detail`,
    )
      .its('status')
      .should('eq', 403)
  })

  it('el listado paginado del director ajeno aísla en silencio: la evaluación del otro departamento no aparece, sin necesitar un 403', () => {
    cy.apiAs(outsider.email, outsider.password, 'GET', '/evaluations/?page=1&limit=50').then(
      (response) => {
        expect(response.status).to.eq(200)
        const items = (response.body as { data: EvaluationOut[] }).data
        expect(items.map((item) => item.id)).to.not.include(evaluation.id)
      },
    )
  })
})
