/**
 * RF — El director debe poder consultar los comentarios filtrados y contarlos
 * por departamento y periodo, así como por docente y periodo.
 *
 * La consulta filtrada pasa por la interfaz en `/comentarios`
 * (`CommentsList`, `GET /comments/`): el periodo se elige por la URL
 * (`?period=`) y el docente por el combobox "Docente", los dos filtros que
 * cubre este RF. El conteo no tiene pantalla propia — nada en el frontend
 * consume `GET /comments/count` ni `GET /comments/teacher-count` — así que
 * esa mitad se queda en la capa de API, como el resumen y los promedios por
 * dimensión en `security/evaluation-access.cy.ts`. El conteo se verifica
 * contra el total que el propio listado filtrado reporta (su
 * `pagination.total`), no contra un número fijo: así la prueba comprueba lo
 * que el RF pide — que el conteo coincida con lo filtrado — sin depender de
 * cuántos comentarios trae exactamente el PDF de tests.
 *
 * Al verificar el RF contra el servidor real apareció un bug real:
 * `GET /comments/teacher-count` no tenía ningún control de acceso —
 * `Depends(get_current_user)`, sin `require_roles` ni comprobación de
 * departamento — así que cualquier autenticado (probado con una cuenta de
 * solo `DOCENTE`) podía pedir el conteo de comentarios de cualquier docente
 * de cualquier departamento con solo su `teacher_id`. Los otros dos
 * endpoints del mismo router (`GET /comments/` y `GET /comments/count`) sí
 * exigen `DIRECTOR DE DEPARTAMENTO` y se acotan al departamento propio de
 * quien llama. Se corrigió en `api.evd`
 * (`count_comments_by_teacher_and_period`, en `api/routes/comments.py`):
 * ahora exige ese mismo rol y compara el departamento del docente contra el
 * del director que llama, igual que el patrón ya usado en
 * `EvaluationService._assert_can_view_department`. Verificado con la suite
 * de `api.evd` y de nuevo contra el servidor real (un director de OTRO
 * departamento recibe `403`, no el conteo) antes de escribir esta prueba —
 * el segundo `it` de abajo ejercita exactamente esa corrección.
 *
 * El fixture es el mismo PDF real de evaluación que usan `upload.cy.ts` y
 * `pdf-extraction.cy.ts` (`cypress/files/2025-1.pdf`, departamento fijo `99`
 * impreso en el documento, periodo `2025-2`), subido por un director recién
 * creado; un segundo director, de un departamento real distinto, es quien
 * prueba el aislamiento. Como en esos specs, el residuo del procesamiento
 * (profesores, cursos y grupos) no se puede borrar en bloque; esta prueba
 * solo limpia la evaluación que ella misma crea y las dos cuentas de
 * director.
 */

import { apiUrl } from '../../support/commands'

const marca = `e2e-comentarios-${Date.now()}`
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

interface TeacherListItem {
  teacher_id: number
  name: string
}

interface CommentCount {
  current_count: number
  department_id?: number
  teacher_id?: number
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
 * ajeno que prueba el aislamiento (igual que `evaluation-access.cy.ts`). */
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

/** ID token de Firebase de una cuenta, para el `cy.task` que sube el PDF. */
function idToken(account: DirectorAccount): Cypress.Chainable<string> {
  return cy
    .request<{ idToken: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email: account.email, password: account.password, returnSecureToken: true },
    })
    .then((signIn) => signIn.body.idToken)
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

/** Total de comentarios que devuelve el listado filtrado (`GET /comments/`)
 * para un periodo, opcionalmente acotado a un docente — la referencia contra
 * la que se comprueban los endpoints de conteo y la interfaz, en vez de un
 * número fijo (que depende de cuántos comentarios trae el PDF de pruebas). */
function filteredTotal(academicPeriodId: number, teacherId?: number): Cypress.Chainable<number> {
  const query = teacherId
    ? `academic_period_id=${academicPeriodId}&teacher_id=${teacherId}`
    : `academic_period_id=${academicPeriodId}`

  return cy
    .apiAs(owner.email, owner.password, 'GET', `/comments/?${query}&limit=1`)
    .then((response) => (response.body as { pagination: { total: number } }).pagination.total)
}

let fixtureDepartment: { id: number }
let otherDepartment: { id: number }
let owner: DirectorAccount
let outsider: DirectorAccount
let evaluation: EvaluationOut
let teachers: TeacherListItem[]

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
          idToken(owner).then((token) => {
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
                  teachers = (teachersResponse.body as { data: TeacherListItem[] }).data
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

describe('Comentarios: consultarlos filtrados y contarlos por departamento/periodo y por docente/periodo', () => {
  it('el director filtra los comentarios de su departamento, en /comentarios, por periodo y por docente', () => {
    const [teacher] = teachers

    cy.visitApp(
      `/comentarios?period=${evaluation.academic_period_code}`,
      'DIRECTOR DE DEPARTAMENTO',
    )
    cy.loginWithEmail(owner.email, owner.password)
    cy.location('pathname').should('eq', '/comentarios')

    // Sin filtrar por docente: los comentarios del periodo de todo el
    // departamento, paginados como reporta la propia API para ese filtro.
    filteredTotal(evaluation.academic_period_id).then((departmentTotal) => {
      const pages = Math.max(1, Math.ceil(departmentTotal / 10))

      cy.contains(`Página 1 de ${pages}`, { timeout: 15000 }).should('be.visible')
    })

    // Filtra por un docente concreto: el combobox "Docente" narra la
    // interfaz, el listado y la paginación deben coincidir con lo que la API
    // reporta para ese mismo filtro.
    filteredTotal(evaluation.academic_period_id, teacher.teacher_id).then((teacherTotal) => {
      const pages = Math.max(1, Math.ceil(teacherTotal / 10))

      cy.get('input[aria-label="Docente"]').click().type(teacher.name)
      cy.get('[data-slot="combobox-item"]').contains(teacher.name).click()

      cy.contains(`Página 1 de ${pages}`, { timeout: 15000 }).should('be.visible')

      // Cada comentario mostrado es de ese docente — `showTeacher` en
      // `CommentsList` imprime su nombre en cada tarjeta.
      cy.get('article').each(($article) => {
        cy.wrap($article).should('contain.text', teacher.name)
      })
    })
  })

  it('cuenta los comentarios del departamento y periodo, y por docente y periodo, igual que el listado filtrado', () => {
    const [teacher] = teachers

    filteredTotal(evaluation.academic_period_id).then((departmentTotal) => {
      cy.apiAs(
        owner.email,
        owner.password,
        'GET',
        `/comments/count?academic_period_id=${evaluation.academic_period_id}`,
      ).then((countResponse) => {
        expect(countResponse.status).to.eq(200)
        const count = (countResponse.body as { data: CommentCount }).data
        expect(count.current_count).to.eq(departmentTotal)
        expect(count.department_id).to.eq(fixtureDepartment.id)
      })
    })

    filteredTotal(evaluation.academic_period_id, teacher.teacher_id).then((teacherTotal) => {
      expect(teacherTotal).to.be.greaterThan(0)

      cy.apiAs(
        owner.email,
        owner.password,
        'GET',
        `/comments/count?academic_period_id=${evaluation.academic_period_id}&teacher_id=${teacher.teacher_id}`,
      ).then((countResponse) => {
        expect(countResponse.status).to.eq(200)
        expect((countResponse.body as { data: CommentCount }).data.current_count).to.eq(
          teacherTotal,
        )
      })

      cy.apiAs(
        owner.email,
        owner.password,
        'GET',
        `/comments/teacher-count?teacher_id=${teacher.teacher_id}&academic_period_id=${evaluation.academic_period_id}`,
      ).then((countResponse) => {
        expect(countResponse.status).to.eq(200)
        expect((countResponse.body as { data: CommentCount }).data.current_count).to.eq(
          teacherTotal,
        )
      })
    })
  })

  it('el conteo por docente aísla por departamento: un director de otro departamento recibe 403, no el conteo', () => {
    const [teacher] = teachers

    // El dueño sí puede.
    cy.apiAs(
      owner.email,
      owner.password,
      'GET',
      `/comments/teacher-count?teacher_id=${teacher.teacher_id}&academic_period_id=${evaluation.academic_period_id}`,
    )
      .its('status')
      .should('eq', 200)

    // Un director de otro departamento, no: el docente no es suyo.
    cy.apiAs(
      outsider.email,
      outsider.password,
      'GET',
      `/comments/teacher-count?teacher_id=${teacher.teacher_id}&academic_period_id=${evaluation.academic_period_id}`,
    ).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.nested.property('error.code')
    })

    // Y el conteo por departamento del director ajeno nunca se acota al
    // departamento del dueño: siempre resuelve contra su propio
    // `department_id`, aislamiento silencioso igual que `GET /comments/`.
    cy.apiAs(
      outsider.email,
      outsider.password,
      'GET',
      `/comments/count?academic_period_id=${evaluation.academic_period_id}`,
    ).then((response) => {
      expect(response.status).to.eq(200)
      const count = (response.body as { data: CommentCount }).data
      expect(count.department_id).to.eq(otherDepartment.id)
      expect(count.department_id).to.not.eq(fixtureDepartment.id)
    })
  })
})
