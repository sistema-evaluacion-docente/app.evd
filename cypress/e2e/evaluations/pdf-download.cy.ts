/**
 * RF — El director debe poder descargar el PDF original desde un endpoint con
 * verificación de permisos. Los archivos subidos nunca se sirven como
 * contenido estático. Se debe poder ver en la ruta frontend `/evaluaciones/:id/pdf`.
 *
 * Verificado contra el backend real antes de escribir esta prueba:
 * `GET /evaluations/{id}/pdf` (`api/routes/evaluations.py`, `download_evaluation_pdf`
 * en `api.evd`) exige ADMIN o el director del departamento de la evaluación
 * (`EvaluationService.get_pdf_path`) y responde `403` a cualquier otro
 * director — no hay `app.mount(StaticFiles, ...)` en `api/app.py`, así que el
 * archivo guardado en `uploads/evaluations/...` no es alcanzable por su ruta
 * en disco sin pasar por este endpoint autenticado; se comprueba pidiéndolo
 * directamente sin token y confirmando que no hay una ruta estática que lo
 * sirva. En la interfaz, `/evaluaciones/:id/pdf` (`EvaluationPdfPage`) pide el
 * documento con el token de la sesión (no una URL pública) y traduce el `403`
 * a un mensaje, no a un PDF vacío o roto.
 *
 * Hallazgo real, documentado y no arreglado a pedido del usuario: la respuesta
 * no manda `Cache-Control` (solo `ETag`/`Last-Modified`), así que el navegador
 * puede cachear por URL el PDF de un director y servirlo, cacheado, a la
 * petición de otro director sin permiso a la misma evaluación — el backend
 * nunca llega a ver esa segunda petición y sí responde `403` cuando se le
 * pregunta aparte. Por eso el orden de las pruebas de este archivo importa:
 * ver el comentario sobre el `describe`.
 *
 * Fixture: el mismo PDF real de `upload.cy.ts`, con su departamento fijo `99`
 * (impreso en el documento, no aleatorizable). El director ajeno de esta
 * prueba no necesita un segundo departamento real: le basta con el rol
 * `DIRECTOR DE DEPARTAMENTO` sin ninguna asignación — el backend compara
 * `evaluation.department_id` contra el `department_id` del token, y ese
 * director no tiene ninguno. El departamento `99` es un fixture compartido
 * entre specs (y, se confirmó al preparar esta prueba, con el propio director
 * real de la universidad usándolo en paralelo): esta prueba anota quién lo
 * dirigía antes de tomarlo prestado y lo restaura en `after()`, en vez de
 * dejarlo sin director como hacen las pruebas más antiguas de esta carpeta.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-pdfdownload-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

interface EvaluationOut {
  id: number
  department_id: number
  pdf_url: string
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla a ningún departamento (igual que `upload.cy.ts`). */
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
 * ha hecho todavía. A diferencia de `upload.cy.ts` y las demás pruebas de esta
 * carpeta, anota su director actual (si tiene uno) para restaurarlo al
 * terminar, en vez de dejarlo sin director — este departamento resultó estar
 * en uso real al preparar esta prueba. */
function findOrCreateFixtureDepartment(): Cypress.Chainable<{
  id: number
  originalDirectorUserId: number | null
}> {
  return cy.api('GET', '/departments/?search=99&limit=10').then((response) => {
    const departments = (
      response.body as {
        data: Array<{ id: number; code: string; director: { id: number } | null }>
      }
    ).data
    const existing = departments.find((department) => department.code === '99')

    if (existing) {
      return cy.wrap({
        id: existing.id,
        originalDirectorUserId: existing.director?.id ?? null,
      })
    }

    return cy.api('GET', '/faculties/?limit=1').then((facultyResponse) => {
      const [faculty] = (facultyResponse.body as { data: Array<{ id: number }> }).data

      return cy
        .api('POST', '/departments/', { name: 'Testing', code: '99', faculty_id: faculty.id })
        .then((created) => ({
          id: (created.body as { data: { id: number } }).data.id,
          originalDirectorUserId: null as number | null,
        }))
    })
  })
}

let fixtureDepartment: { id: number; originalDirectorUserId: number | null }
let owner: DirectorAccount
let outsider: DirectorAccount
let evaluation: EvaluationOut
let createdOwnEvaluation = false

before(() => {
  findOrCreateFixtureDepartment().then((department) => {
    fixtureDepartment = department

    if (department.originalDirectorUserId != null) {
      cy.api('DELETE', `/departments/${department.id}/director`)
    }

    createDirectorAccount('ajeno').then((account) => {
      outsider = account
    })

    createDirectorAccount('dueno').then((account) => {
      owner = account

      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, {
        user_id: account.id,
      }).then(() => {
        // El departamento `99` puede ya tener una evaluación activa real (el
        // mismo motivo por el que se restaura su director en `after()`): un
        // segundo PDF para el mismo periodo respondería `409`. Se reutiliza
        // esa evaluación si existe — el director recién asignado ya puede
        // verla, es del departamento, no de quien la subió — y solo se sube
        // una propia si de verdad no hay ninguna.
        cy.apiAs(owner.email, owner.password, 'GET', '/evaluations/?page=1&limit=1').then(
          (listResponse) => {
            const [existingEvaluation] = (listResponse.body as { data: EvaluationOut[] }).data

            if (existingEvaluation) {
              evaluation = existingEvaluation
              createdOwnEvaluation = false
              return
            }

            tokenFor(owner.email, owner.password).then((token) => {
              cy.task('uploadMultipart', {
                url: apiUrl('/evaluations/upload'),
                token,
                files: [{ filename: '2025-1.pdf', path: FIXTURE }],
              }).then((result) => {
                const { status, body } = result as {
                  status: number
                  body: { data: EvaluationOut }
                }

                expect(status).to.eq(202)
                evaluation = body.data
                createdOwnEvaluation = true
              })
            })
          },
        )
      })
    })
  })
})

after(() => {
  // Solo se borra la evaluación si esta prueba la creó — la que ya existía
  // en el departamento no es suya para borrar.
  if (evaluation && createdOwnEvaluation) {
    cy.apiAs(owner.email, owner.password, 'DELETE', `/evaluations/${evaluation.id}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${owner.uid}/status`, { active: false })
  cy.api('PATCH', `/users/${outsider.uid}/status`, { active: false })

  // Este departamento es un fixture compartido y, se confirmó al preparar
  // esta prueba, estaba en uso real: se devuelve tal como se encontró en vez
  // de dejarlo sin director.
  if (fixtureDepartment.originalDirectorUserId != null) {
    cy.api('POST', `/departments/${fixtureDepartment.id}/director`, {
      user_id: fixtureDepartment.originalDirectorUserId,
    })
  }
})

describe('Descarga del PDF original de una evaluación', () => {
  // El director ajeno va antes que el dueño a propósito. `GET .../pdf` no
  // manda `Cache-Control` (solo `ETag`/`Last-Modified`) — el navegador cachea
  // la respuesta por URL, sin distinguir por cabecera `Authorization`. Visto
  // al preparar esta prueba: si el dueño entra primero, la petición del
  // director ajeno a la misma URL la resuelve la caché del navegador con el
  // `200` del dueño, sin llegar al backend — que si se le pregunta aparte
  // (`cy.apiAs`, o con `curl` puro) responde `403` correctamente. Con el
  // ajeno primero, no hay nada cacheado todavía y la interfaz refleja el
  // permiso real. Queda documentado como límite conocido en `E2E.md`.
  it('un director de otro departamento recibe 403 por la API, y la interfaz muestra el aviso de permiso, no un PDF', () => {
    cy.apiAs(outsider.email, outsider.password, 'GET', `/evaluations/${evaluation.id}/pdf`).then(
      (response) => {
        expect(response.status).to.eq(403)
      },
    )

    cy.visitApp(`/evaluaciones/${evaluation.id}/pdf`)
    cy.loginWithEmail(outsider.email, outsider.password)
    cy.location('pathname').should('eq', `/evaluaciones/${evaluation.id}/pdf`)

    cy.contains('No tiene permiso para ver este documento.').should('be.visible')
    cy.get('object[aria-label="Documento PDF"]').should('not.exist')
  })

  it('el director de ese departamento lo descarga por la API, y la interfaz lo muestra en /evaluaciones/:id/pdf', () => {
    cy.apiAs(owner.email, owner.password, 'GET', `/evaluations/${evaluation.id}/pdf`).then(
      (response) => {
        expect(response.status).to.eq(200)
      },
    )

    cy.visitApp(`/evaluaciones/${evaluation.id}/pdf`)
    cy.loginWithEmail(owner.email, owner.password)
    cy.location('pathname').should('eq', `/evaluaciones/${evaluation.id}/pdf`)

    cy.get('object[aria-label="Documento PDF"]').should('exist')
    cy.contains('No tiene permiso').should('not.exist')
  })

  it('sin token responde 401, y el archivo no es alcanzable como contenido estático', () => {
    cy.request({
      url: apiUrl(`/evaluations/${evaluation.id}/pdf`),
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 401)

    // El propio nombre del archivo en disco, pedido directamente: no hay
    // `StaticFiles` montado en `api.evd` que lo sirva por esa ruta.
    cy.request({
      url: apiUrl(`/${evaluation.pdf_url}`),
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 404)
  })
})
