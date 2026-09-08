/**
 * RF — El director debe poder corregir manualmente el nivel de riesgo y las
 * categorías pedagógicas asignadas a un comentario.
 *
 * La corrección pasa por la interfaz: el popover "Editar clasificación"
 * (`CommentClassificationEditor`/`CommentClassificationForm`) que cuelga de
 * cada `CommentCard` cuando quien mira opera como
 * `DIRECTOR DE DEPARTAMENTO`, y que llama a `PATCH /comments/{comment_id}`.
 * Verificado contra el servidor real antes de escribir esta prueba (sin
 * necesidad de correr el análisis de IA primero: un comentario recién
 * extraído del PDF, sin clasificar todavía — `risk_level: null`,
 * `pedagogical_categories: []` — se corrige igual): el nivel de riesgo y las
 * categorías quedan con el valor elegido, `risk_score`/`score` en `1` (una
 * decisión humana, no una estimación), `*_ai_model` en `null` (ya no la puso
 * un modelo) y `*_modified_by_director` en `true`. Un director de OTRO
 * departamento recibe `403` al intentarlo (`CommentService.update_classification`
 * compara el departamento de la evaluación del comentario contra el del
 * director que llama) — no se encontró ningún bug al verificar esto, así que
 * la prueba solo confirma el comportamiento ya correcto.
 *
 * El comentario objetivo se elige por API, no por el DOM: `GET /comments/`
 * sin más filtro que el periodo es exactamente la consulta que hace
 * `CommentsList` al entrar a `/comentarios`, así que su primer resultado es
 * el primer `<article>` que la página renderiza — evita depender de qué
 * texto trae el PDF de pruebas o de en qué página cae un comentario elegido
 * al azar.
 *
 * El fixture es el mismo PDF real que usan `upload.cy.ts`, `pdf-extraction.cy.ts`
 * y `evaluations/comments.cy.ts` (departamento fijo `99`, periodo `2025-2`),
 * subido por un director recién creado; un segundo director, de un
 * departamento real distinto, prueba el aislamiento. Mismo residuo entre
 * corridas que esos specs (profesores/cursos/grupos que el procesamiento
 * deja); esta prueba solo limpia la evaluación que ella misma crea y las dos
 * cuentas de director.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-clasificacion-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const MAX_POLL_ATTEMPTS = 20
const THROWAWAY_PASSWORD = 'Prueba-e2e-1!'

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

interface CommentOut {
  id: number
  risk_level: { id: number; name: string } | null
  risk_score: number | null
  risk_level_ai_model: string | null
  risk_level_modified_by_director: boolean
  pedagogical_categories: Array<{ id: number; name: string; score: number }>
  pedagogical_category_ai_model: string | null
  pedagogical_category_modified_by_director: boolean
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento. */
function createDirectorAccount(label: string): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}-${label}@ufps.edu.co`
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

/** Un departamento real sin director, distinto del `99` — para el director
 * ajeno que prueba el aislamiento (igual que `evaluation-access.cy.ts` y
 * `evaluations/comments.cy.ts`). */
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

let fixtureDepartment: { id: number }
let otherDepartment: { id: number }
let owner: DirectorAccount
let outsider: DirectorAccount
let evaluation: EvaluationOut
/** El primer comentario que la propia API devuelve para el periodo sin más
 * filtro — la misma consulta que `CommentsList` hace al entrar a
 * `/comentarios`, así que es también el primer `<article>` de la página. */
let targetCommentId: number

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

                cy.apiAs(
                  owner.email,
                  owner.password,
                  'GET',
                  `/comments/?academic_period_id=${ev.academic_period_id}&limit=1`,
                ).then((commentsResponse) => {
                  const [comment] = (commentsResponse.body as { data: CommentOut[] }).data
                  targetCommentId = comment.id
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
  cy.api('DELETE', `/departments/${otherDepartment.id}/director`)
  cy.api('PATCH', `/users/${owner.uid}/status`, { active: false })
  cy.api('PATCH', `/users/${outsider.uid}/status`, { active: false })
})

describe('Corrección manual del nivel de riesgo y la categoría pedagógica de un comentario', () => {
  it('el director corrige, desde /comentarios, el nivel de riesgo y la categoría de un comentario sin clasificar', () => {
    cy.visitApp(
      `/comentarios?period=${evaluation.academic_period_code}`,
      'DIRECTOR DE DEPARTAMENTO',
    )
    cy.loginWithEmail(owner.email, owner.password)
    cy.location('pathname').should('eq', '/comentarios')

    cy.get(`article#${targetCommentId}`, { timeout: 15000 }).within(() => {
      cy.get('button[aria-label="Editar clasificación del comentario"]').click()
    })

    cy.get('[data-slot="popover-content"]').should('contain.text', 'Editar clasificación')

    // Nivel de riesgo: el `Select` de shadcn abre su contenido en un portal,
    // así que el disparador se busca dentro del popover pero la opción, no.
    cy.get('[data-slot="popover-content"] [data-slot="select-trigger"]').click()
    cy.get('[data-slot="select-item"]').contains('Alto').click()

    // Categoría pedagógica: casilla dentro de una `<label>` real, clicable
    // por su texto.
    cy.get('[data-slot="popover-content"]').contains('label', 'Desempeño docente').click()

    cy.get('[data-slot="popover-content"]').contains('button', 'Guardar').click()

    cy.contains('Clasificación actualizada').should('be.visible')

    // El popover se cierra solo (`onSaved`) y la tarjeta queda con la
    // corrección — nivel de riesgo, categoría y las marcas de "Editado" que
    // distinguen una corrección humana de una clasificación de IA.
    cy.get('[data-slot="popover-content"]').should('not.exist')

    // La lista se recarga en la página/orden por defecto, que no garantiza
    // que el comentario editado siga cayendo ahí — un departamento con mucho
    // historial lo puede correr de la página 1 con solo cambiar su
    // `risk_level`. En vez de perseguir la paginación, se fija por id con el
    // mismo mecanismo de `#<id>` que usa un enlace de notificación
    // (`useLinkedCommentId` en `CommentsList`), que lo trae aparte con
    // `GET /comments/{id}` sin importar dónde caiga en la lista paginada.
    cy.window().then((win) => {
      win.location.hash = `#${targetCommentId}`
    })

    cy.get(`article#${targetCommentId}`).within(() => {
      cy.contains('ALTO').should('be.visible')
      cy.contains('Desempeño docente').should('be.visible')
      cy.contains('Editado').should('be.visible')
    })

    // Lo que la interfaz muestra es lo que de verdad quedó guardado: puntaje
    // de certeza en 1 (una decisión humana, no una estimación de IA), sin
    // modelo de IA asociado, y las dos marcas de "modificado por el director".
    cy.apiAs(owner.email, owner.password, 'GET', `/comments/${targetCommentId}`).then(
      (response) => {
        const comment = (response.body as { data: CommentOut }).data

        expect(comment.risk_level?.name).to.eq('ALTO')
        expect(comment.risk_score).to.eq(1)
        expect(comment.risk_level_ai_model).to.eq(null)
        expect(comment.risk_level_modified_by_director).to.eq(true)

        expect(comment.pedagogical_categories.map((c) => c.name)).to.include('LABEL_1')
        expect(comment.pedagogical_categories.every((c) => c.score === 1)).to.eq(true)
        expect(comment.pedagogical_category_ai_model).to.eq(null)
        expect(comment.pedagogical_category_modified_by_director).to.eq(true)
      },
    )
  })

  it('un director de otro departamento recibe 403 al intentar corregirlo, y el comentario no cambia', () => {
    cy.apiAs(outsider.email, outsider.password, 'PATCH', `/comments/${targetCommentId}`, {
      risk_level: 1,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.nested.property('error.code', 'PERMISSION_DENIED')
    })

    // Sigue con la clasificación que puso el dueño en la prueba anterior, no
    // la que intentó el de afuera.
    cy.apiAs(owner.email, owner.password, 'GET', `/comments/${targetCommentId}`).then(
      (response) => {
        const comment = (response.body as { data: CommentOut }).data

        expect(comment.risk_level?.name).to.eq('ALTO')
      },
    )
  })
})
