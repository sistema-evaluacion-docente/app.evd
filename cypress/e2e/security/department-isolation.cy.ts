/**
 * RF — Aislamiento del director frente a recursos de otro departamento: pedir
 * el historial de un docente que no pertenece a su departamento responde
 * `403`, no un listado vacío. La distinción importa porque el listado
 * (`GET /teachers/`) sí resuelve el aislamiento en silencio, sustituyendo
 * cualquier `department_id` que llegue por query por el del director — un
 * docente ajeno simplemente no aparece. El detalle por ID no tiene ese filtro
 * que aplicar: si el backend no comprobara el departamento explícitamente, un
 * director vería el historial de cualquier docente de la universidad. La
 * prueba llama a la API real, sin pasar por la interfaz, con un director de
 * un solo rol asignado de verdad (vía `/departments/{id}/director`, no solo
 * con `department_id` en el usuario) para que la comprobación por
 * departamento se ejercite igual que en producción.
 */

const marca = `e2e-deptiso-${Date.now()}`

interface RoleAccount {
  uid: string
  email: string
  password: string
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento (eso lo hace `assignDirector`). */
function createDirectorAccount(): Cypress.Chainable<RoleAccount & { id: number }> {
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
          name: 'Cuenta de prueba — director',
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

let director: RoleAccount
let directorId: number
let ownDepartment: { id: number }
let otherDepartment: { id: number }
let ownTeacher: { id: number }
let otherTeacher: { id: number }

before(() => {
  // Dos departamentos sin director asignado ahora mismo, para no desplazar a
  // uno real: la propia API expone `director` en el listado.
  cy.api('GET', '/departments/?page=1&limit=50').then((response) => {
    const departments = (
      response.body as { data: Array<{ id: number; director: unknown }> }
    ).data.filter((d) => d.director === null)

    if (departments.length < 2) {
      throw new Error(
        'Se necesitan al menos dos departamentos sin director asignado para esta prueba.',
      )
    }

    ;[ownDepartment, otherDepartment] = departments

    // Un docente de verdad en cada departamento — no reutilizamos ninguno
    // existente para no depender de qué datos haya en el entorno.
    cy.api('POST', '/teachers/', {
      institutional_code: `${Date.now()}1`,
      department_id: ownDepartment.id,
    }).then((r) => {
      ownTeacher = (r.body as { data: { id: number } }).data
    })

    cy.api('POST', '/teachers/', {
      institutional_code: `${Date.now()}2`,
      department_id: otherDepartment.id,
    }).then((r) => {
      otherTeacher = (r.body as { data: { id: number } }).data
    })

    createDirectorAccount().then((account) => {
      director = account
      directorId = account.id

      // Asignación real (tabla `directors`), no solo `department_id` en el
      // usuario: así se ejercita la misma comprobación que en producción.
      cy.api('POST', `/departments/${ownDepartment.id}/director`, {
        user_id: directorId,
      })
    })
  })
})

after(() => {
  cy.api('DELETE', `/departments/${ownDepartment.id}/director`)
  cy.api('DELETE', `/teachers/${ownTeacher.id}`)
  cy.api('DELETE', `/teachers/${otherTeacher.id}`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('API: un director no accede al historial de un docente de otro departamento', () => {
  it('sí accede al historial de un docente de su propio departamento', () => {
    cy.apiAs(
      director.email,
      director.password,
      'GET',
      `/teachers/${ownTeacher.id}/history?page=1&limit=5`,
    )
      .its('status')
      .should('eq', 200)
  })

  it('recibe 403 al pedir el historial de un docente de otro departamento, no un listado vacío', () => {
    cy.apiAs(
      director.email,
      director.password,
      'GET',
      `/teachers/${otherTeacher.id}/history?page=1&limit=5`,
    ).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.nested.property('error.code')
      // La respuesta prohibida no es un 200 con `data` vacía o nula — eso es
      // justo lo que este RF distingue de un listado sin resultados.
      expect(response.status).to.not.eq(200)
    })
  })
})
