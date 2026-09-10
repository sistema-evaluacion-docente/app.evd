/**
 * RF — El director debe poder cargar los PDF oficiales de evaluación
 * correspondientes a un periodo y a su departamento.
 *
 * Todo pasa por la interfaz contra la API real, en `/evaluaciones/cargar`, con
 * `cypress/files/2025-1.pdf` — un PDF real de la universidad, no uno
 * fabricado para la prueba. El backend no recibe el periodo ni el
 * departamento como campos del formulario: los lee del propio contenido del
 * PDF (`api/utils/pdf_parser.py` en `api.evd`), así que la prueba no puede
 * elegirlos — tiene que acomodarse a lo que el documento ya trae grabado:
 *
 * - Título de cada página: "... Segundo Semestre de 2025" → periodo `2025-2`.
 * - Línea de departamento: "99 TESTING" → departamento de código fijo `99`.
 *
 * A diferencia del resto de fixtures de este repo, el código del departamento
 * no puede aleatorizarse con `marca`: viene impreso en el PDF. La prueba
 * busca (o crea, si no existe) el departamento de código `99` y lo usa tal
 * cual, sin poder dejarlo limpio al final — igual que `academic-groups.cy.ts`
 * documenta para los cursos y grupos que el procesamiento del PDF genera sin
 * pantalla propia, aquí el procesamiento deja profesores/cursos/grupos bajo
 * ese departamento y el periodo `2025-2` que no tienen forma de borrarse en
 * bloque. Lo único que la prueba limpia es lo suyo: la evaluación creada y
 * las dos cuentas de director desechables.
 *
 * Dos pruebas, mismo PDF:
 * - Un director asignado de verdad (`POST /departments/{id}/director`) al
 *   departamento `99` lo sube con éxito.
 * - Un director de otro departamento real intenta subir el mismo PDF: la API
 *   lo rechaza porque el departamento del documento no es el suyo — así se
 *   ejercita la otra mitad del RF ("... y a su departamento") sin necesitar
 *   un segundo PDF de fixture.
 */

const marca = `e2e-evalupload-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento. */
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
 * ha hecho todavía. No se puede randomizar: el código viene fijo en el PDF.
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
 * que intenta subir el PDF de un departamento que no es el suyo. */
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

let fixtureDepartment: { id: number }
let otherDepartment: { id: number }
let ownDirector: DirectorAccount
let otherDirector: DirectorAccount
let createdEvaluationId: number | undefined

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    // Desasignar cuando no hay ningún director responde 404, no un no-op —
    // solo se libera el cupo si de verdad hay alguien ocupándolo.
    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    findDepartmentWithoutDirector('99').then((department) => {
      otherDepartment = department
    })

    createDirectorAccount('propio').then((account) => {
      ownDirector = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
    })

    createDirectorAccount('ajeno').then((account) => {
      otherDirector = account
      cy.api('POST', `/departments/${otherDepartment.id}/director`, { user_id: account.id })
    })
  })
})

after(() => {
  // Solo el director del departamento de la evaluación puede borrarla — ni
  // siquiera ADMIN vale (`DIRECTOR_DE_DEPARTAMENTO` es el único rol que
  // acepta la ruta) — así que hay que borrarla con la cuenta del propio
  // director, y antes de desasignarlo.
  if (createdEvaluationId != null) {
    cy.apiAs(
      ownDirector.email,
      ownDirector.password,
      'DELETE',
      `/evaluations/${createdEvaluationId}`,
    )
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('DELETE', `/departments/${otherDepartment.id}/director`)
  cy.api('PATCH', `/users/${ownDirector.uid}/status`, { active: false })
  cy.api('PATCH', `/users/${otherDirector.uid}/status`, { active: false })
})

describe('Carga del PDF oficial de evaluación', () => {
  it('el director de ese departamento lo sube con éxito, para el periodo y departamento del PDF', () => {
    cy.visitApp('/evaluaciones/cargar')
    cy.loginWithEmail(ownDirector.email, ownDirector.password)
    cy.location('pathname').should('eq', '/evaluaciones/cargar')

    cy.get('input[type="file"]').selectFile(FIXTURE, { force: true })
    cy.contains(FIXTURE.split('/').pop()!).should('be.visible')

    cy.contains('button', 'Subir evaluación').click()

    cy.contains('Evaluación subida').should('be.visible')
    cy.contains('Evaluación subida. El procesamiento continúa en segundo plano.').should(
      'be.visible',
    )

    // El toast de éxito puede seguir tapando el botón cuando Cypress ya lo
    // considera listo para el clic.
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
            data: { department_id: number; academic_period_code: string }
          }
        ).data

        expect(evaluation.department_id).to.eq(fixtureDepartment.id)
        expect(evaluation.academic_period_code).to.eq('2025-2')
      })
    })
  })

  it('rechaza a un director de otro departamento: el PDF no es del suyo', () => {
    cy.visitApp('/evaluaciones/cargar')
    cy.loginWithEmail(otherDirector.email, otherDirector.password)
    cy.location('pathname').should('eq', '/evaluaciones/cargar')

    cy.get('input[type="file"]').selectFile(FIXTURE, { force: true })
    cy.contains('button', 'Subir evaluación').click()

    cy.contains('no es el departamento asignado').should('be.visible')
    cy.contains('Evaluación subida').should('not.exist')
    cy.location('pathname').should('eq', '/evaluaciones/cargar')
  })
})
