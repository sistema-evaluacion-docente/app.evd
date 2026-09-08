/**
 * RF — El procesamiento de las evaluaciones debe ejecutarse en segundo plano
 * y reportar su progreso en tiempo real. La evaluación transita por los
 * estados PROCESSING, COMPLETED o FAILED.
 *
 * Como en `upload.cy.ts` y `pdf-extraction.cy.ts`, no hay pantalla propia para
 * "el procesamiento" — es lo que pasa tras subir un PDF — así que la prueba
 * se queda en la capa de API, con un añadido: en vez de solo sondear
 * `GET /evaluations/{id}` (el mecanismo de respaldo), esta prueba engancha el
 * canal real de tiempo real, `GET /ws/evaluations/{id}` (WebSocket), que es
 * la vía rápida que usa la interfaz (`useEvaluationLogsStore`).
 *
 * La carrera importa: el backend no reproduce eventos para un cliente que se
 * conecta tarde (`ConnectionManager.broadcast` solo entrega a quien ya está
 * suscrito), y el procesamiento de este PDF termina en menos de un segundo.
 * Verificado contra el servidor real antes de escribir la prueba: el propio
 * parseo del PDF ocurre síncronamente dentro de la petición de subida (antes
 * del `202`), así que la tarea en segundo plano que queda son solo los
 * `INSERT` — típicamente unos 90ms desde que se abre el socket. Un comando de
 * Cypress (`cy.request` + un `WebSocket` del navegador) pierde esa carrera por
 * el ida-y-vuelta con el proceso de Cypress; por eso el socket se abre desde
 * Node, en el mismo `cy.task` que hace la subida (`uploadAndWatchProgress` en
 * `cypress.config.ts`), en el instante en que llega el `202`.
 *
 * FAILED, verificado y no forzado: el único punto donde el procesamiento en
 * segundo plano pone `status: "FAILED"` es si el periodo o el departamento no
 * existen tras parsear el PDF — pero `prepare_upload` (en `api.evd`) ya crea
 * el periodo y valida el departamento *antes* de programar esa tarea, así que
 * esa rama es inalcanzable con cualquier PDF, dañado o no: uno dañado nunca
 * llega a esa tarea, porque el parseo (síncrono) responde `400`/`422` antes
 * de programarla. No se fabricó un PDF para forzar esa rama porque, tal como
 * está el código, no hay entrada que la alcance — sería fabricar un test que
 * pasa por construcción, no una prueba del RF. `waitForProcessedEvaluation`
 * en `pdf-extraction.cy.ts` sí trata `FAILED` como resultado válido del
 * sondeo, por si esto cambia.
 */

import { apiUrl } from '../../support/commands'

const marca = `e2e-procstatus-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

interface EvaluationOut {
  id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

interface EvaluationProgressEvent {
  type: 'evaluation_progress'
  evaluation_id: number
  stage: 'UPLOADING' | 'ANALYZING'
  status?: string
  count?: number
}

interface EvaluationLogEvent {
  type: 'evaluation_log'
  evaluation_id: number
  message: string
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento (igual que `upload.cy.ts`). */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
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

/** ID token de Firebase del director, para el `cy.task` que sube el PDF y
 * escucha el WebSocket. */
function directorIdToken(director: DirectorAccount): Cypress.Chainable<string> {
  return cy
    .request<{ idToken: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email: director.email, password: director.password, returnSecureToken: true },
    })
    .then((signIn) => signIn.body.idToken)
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
  // que en `upload.cy.ts` y `pdf-extraction.cy.ts`.
  if (createdEvaluationId != null) {
    cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${createdEvaluationId}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Procesamiento en segundo plano de una evaluación', () => {
  it('responde de inmediato en PROCESSING, reporta el avance por WebSocket en tiempo real y termina en COMPLETED', () => {
    directorIdToken(director).then((token) => {
      cy.task('uploadAndWatchProgress', {
        url: apiUrl('/evaluations/upload'),
        wsBase: apiUrl('/ws/evaluations').replace(/^http/, 'ws'),
        token,
        files: [{ filename: '2025-1.pdf', path: FIXTURE }],
      }).then((result) => {
        const { status, body, events } = result as {
          status: number
          body: { data: EvaluationOut }
          events: Array<EvaluationProgressEvent | EvaluationLogEvent>
        }

        // Se ejecuta en segundo plano: el 202 llega con la evaluación ya
        // creada, pero todavía procesándose — no es un 200 con el resultado
        // ya listo.
        expect(status).to.eq(202)
        expect(body.data.status).to.eq('PROCESSING')
        createdEvaluationId = body.data.id

        // Reporta su progreso en tiempo real: el socket, abierto justo tras
        // el 202, recibió al menos un evento mientras la tarea corría.
        expect(events.length).to.be.greaterThan(0)
        events.forEach((event) => expect(event.evaluation_id).to.eq(body.data.id))

        const logEvents = events.filter(
          (event): event is EvaluationLogEvent => event.type === 'evaluation_log',
        )
        expect(logEvents.length).to.be.greaterThan(0)
        logEvents.forEach((event) => expect(event.message.length).to.be.greaterThan(0))

        // Transita a COMPLETED: el último evento de avance de la etapa de
        // carga trae el estado final, entregado en el momento en que ocurrió,
        // no descubierto por un sondeo posterior.
        const progressEvents = events.filter(
          (event): event is EvaluationProgressEvent =>
            event.type === 'evaluation_progress' && event.stage === 'UPLOADING',
        )
        expect(progressEvents.length).to.be.greaterThan(0)

        const finalEvent = progressEvents[progressEvents.length - 1]
        expect(finalEvent.status).to.eq('COMPLETED')
        expect(finalEvent.count).to.be.greaterThan(0)

        // Y ese mismo estado es el que ve cualquiera que lo consulte después
        // por la vía de respaldo (el sondeo que ya prueban `upload.cy.ts` y
        // `pdf-extraction.cy.ts`) — las dos rutas de reporte concuerdan.
        cy.api('GET', `/evaluations/${createdEvaluationId}`).then((response) => {
          const evaluation = (response.body as { data: EvaluationOut }).data

          expect(evaluation.status).to.eq('COMPLETED')
        })
      })
    })
  })
})
