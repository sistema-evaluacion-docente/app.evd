/**
 * RF — El sistema debe aceptar hasta dos PDF por evaluación, uno para
 * programas presenciales y otro para programas a distancia. Ambos deben
 * coincidir en periodo y departamento y pertenecer a modalidades distintas.
 *
 * Comparte fixture con `upload.cy.ts`: el departamento de código fijo `99`
 * ("Testing"), impreso en ambos PDF, así que tampoco aquí se puede
 * aleatorizar con `marca`. `cypress/files/2025-1.pdf` y
 * `cypress/files/2025-1-DISTANCIA.pdf` son el mismo reporte real de la
 * universidad, uno por modalidad — se verificó contra el backend real
 * (`api.evd`, `EvaluationService._parse_uploads`) que ambos comparten
 * periodo (`2025-2`) y departamento (`99`) y declaran modalidades distintas
 * (`PRESENCIAL` / `DISTANCIA`), que es justo lo que exige este RF.
 *
 * Dos pruebas:
 * - Por la interfaz: un director asignado al `99` sube los dos PDF juntos en
 *   `/evaluaciones/cargar` y la API los fusiona en una sola evaluación, con
 *   el periodo y el departamento que traen grabados y un documento guardado
 *   por modalidad (`pdf_urls`), cada una con datos propios.
 * - Contra la API real, sin pasar por la interfaz: el selector de archivos
 *   ya impide elegir el mismo PDF dos veces (mismo nombre y tamaño rechazan
 *   con "Ya adjuntó...", ver `useMultiFileUpload` en `useFileUpload.ts`), así
 *   que nunca llegaría a ejercitar la validación del backend que exige
 *   modalidades distintas. Para probar esa validación de verdad hay que
 *   llamar al endpoint directamente (como hace `token.cy.ts` para la
 *   autenticación), subiendo el mismo PDF de distancia dos veces con
 *   nombres de archivo distintos.
 *
 * Lo que no cubre: un desajuste de periodo o de departamento *entre los dos
 * PDF* (la otra mitad de "deben coincidir en periodo y departamento"). Los
 * dos fixtures disponibles comparten periodo y departamento a propósito, y
 * fabricar un tercer PDF solo para forzar el desajuste iría en contra de
 * usar únicamente reportes reales de la universidad. `upload.cy.ts` sí cubre
 * un desajuste relacionado, con un solo PDF: un director de otro
 * departamento intentando subir un PDF que no es el suyo.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-evalmodalidades-${Date.now()}`
const FIXTURE_PRESENCIAL = 'cypress/files/2025-1.pdf'
const FIXTURE_DISTANCIA = 'cypress/files/2025-1-DISTANCIA.pdf'

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento. */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}-director@ufps.edu.co`
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

/** Busca el departamento de código `99` que exigen ambos PDF (igual que
 * `upload.cy.ts`); lo crea si nadie lo ha hecho todavía. Incluye si ya tiene
 * director — desasignar cuando no hay ninguno responde `404`, no un no-op. */
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
  // Solo el director del departamento de la evaluación puede borrarla, igual
  // que en `upload.cy.ts`.
  if (createdEvaluationId != null) {
    cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${createdEvaluationId}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Fusión de los dos PDF de una evaluación (presencial y a distancia)', () => {
  it('un director sube ambos PDF y la API los fusiona en una sola evaluación', () => {
    cy.visitApp('/evaluaciones/cargar')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/evaluaciones/cargar')

    cy.get('input[type="file"]').selectFile([FIXTURE_PRESENCIAL, FIXTURE_DISTANCIA], {
      force: true,
    })
    cy.contains(FIXTURE_PRESENCIAL.split('/').pop()!).should('be.visible')
    cy.contains(FIXTURE_DISTANCIA.split('/').pop()!).should('be.visible')

    cy.contains('button', 'Subir evaluación').click()

    cy.contains('Evaluación subida').should('be.visible')

    // El toast de éxito puede seguir tapando el botón cuando Cypress ya lo
    // considera listo para el clic (igual que en `upload.cy.ts`).
    cy.contains('button', 'Ver evaluación').click({ force: true })

    cy.location('pathname')
      .should('match', /^\/evaluaciones\/\d+$/)
      .then((pathname) => {
        createdEvaluationId = Number(pathname.split('/').pop())
      })

    // El periodo del PDF ("Segundo Semestre de 2025") se lee, no se elige.
    cy.contains('2025-2').should('be.visible')

    cy.then(() => {
      cy.api('GET', `/evaluations/${createdEvaluationId}`).then((response) => {
        const evaluation = (
          response.body as {
            data: { department_id: number; academic_period_code: string; pdf_urls: string[] }
          }
        ).data

        expect(evaluation.department_id).to.eq(fixtureDepartment.id)
        expect(evaluation.academic_period_code).to.eq('2025-2')
        // Un documento por modalidad, guardado aparte, no un solo PDF fusionado.
        expect(evaluation.pdf_urls).to.have.length(2)
        expect(evaluation.pdf_urls.some((url) => url.includes('presencial_'))).to.eq(true)
        expect(evaluation.pdf_urls.some((url) => url.includes('distancia_'))).to.eq(true)
      })

      // Cada modalidad trae docentes propios: no es solo que se aceptaron los
      // dos PDF, es que ambos aportaron datos reales a la evaluación fusionada.
      cy.api('GET', `/evaluations/${createdEvaluationId}?modality=PRESENCIAL`).then((response) => {
        const evaluation = (response.body as { data: { count: number } }).data
        expect(evaluation.count).to.be.greaterThan(0)
      })

      cy.api('GET', `/evaluations/${createdEvaluationId}?modality=DISTANCIA`).then((response) => {
        const evaluation = (response.body as { data: { count: number } }).data
        expect(evaluation.count).to.be.greaterThan(0)
      })
    })
  })

  it('rechaza dos PDF de la misma modalidad, sin pasar por el selector de archivos', () => {
    tokenFor(director.email, director.password).then((token) => {
      // El mismo PDF de distancia, subido dos veces con nombres distintos:
      // dos documentos, misma modalidad — justo lo que este RF prohíbe. Va
      // por `cy.task` (ver `cypress.config.ts`), no por `cy.request`, que
      // corrompería el binario del PDF.
      cy.task('uploadMultipart', {
        url: apiUrl('/evaluations/upload'),
        token,
        files: [
          { filename: 'a.pdf', path: FIXTURE_DISTANCIA },
          { filename: 'b.pdf', path: FIXTURE_DISTANCIA },
        ],
      }).then((result) => {
        const { status, body } = result as { status: number; body: { error: { message: string } } }

        expect(status).to.eq(422)
        expect(body.error.message).to.contain('misma modalidad')
      })
    })
  })
})
