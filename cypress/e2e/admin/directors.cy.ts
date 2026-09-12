/**
 * RF — El administrador debe poder gestionar los directores de departamento.
 *
 * La pantalla que implementa esto es `/admin/directores`: lista, busca y
 * filtra por estado a todos los directores de la universidad, con una acción
 * "Eliminar" por fila. Asignar o desasignar el director de un departamento
 * concreto es otro RF (RF-2.2) y ya tiene su propia prueba en
 * `admin/departments.cy.ts` — esta se queda en lo que solo existe aquí:
 * consultar el registro completo y eliminar un director directamente
 * (`DELETE /directors/{id}`), sin pasar por su departamento.
 *
 * No hay pantalla de alta ni de edición para este recurso (la API sí expone
 * `POST`/`PUT /directors/`, pero el frontend no los usa) — el único camino
 * real para que exista un director es asignarlo desde un departamento, así
 * que el fixture usa `POST /departments/{id}/director`, igual que
 * `departments.cy.ts`. Cada prueba crea su propio departamento desechable
 * (`/departments/` sí expone borrado real) y reutiliza la misma cuenta de un
 * solo rol (`DOCENTE`) para no crear un usuario de Firebase por prueba.
 *
 * Al verificar el RF contra el servidor real apareció un bug en `api.evd`:
 * `DELETE /directors/{id}` borraba la fila pero no retiraba el rol
 * `DIRECTOR DE DEPARTAMENTO` del usuario — a diferencia de
 * `DELETE /departments/{id}/director` (el otro camino de borrado), que sí lo
 * hacía. El propio comentario de ese código decía que retirar el rol "ya era
 * trabajo de `DirectorService.delete`", pero `delete()` nunca lo hacía: un
 * director eliminado desde esta pantalla se quedaba viendo el menú y las
 * rutas de director para siempre, sin departamento a cargo. Se corrigió
 * compartiendo la lógica entre los dos métodos (`_retire_director_role`), y
 * esta prueba comprueba justo eso — no solo que la fila desaparezca de la
 * tabla.
 *
 * Límite conocido, sin arreglar a pedido del usuario: `GET /directors/`
 * busca por nombre, correo y nombre/código del *departamento*, pero no por el
 * `institutional_code` del director — aunque la columna "Código" lo muestra y
 * el tipo `DirectorParams` del frontend documenta que sí se busca por él. Por
 * eso esta prueba busca por nombre, que sí funciona, no por código.
 */

const marca = `e2e-directores-${Date.now()}`

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
  name: string
}

let facultyId: number
let director: DirectorAccount

/** Crea, por API, una cuenta real de Firebase con rol `DOCENTE` — elegible
 * como director, igual que `departments.cy.ts`. Una sola cuenta para todo el
 * archivo: cada prueba la asigna a su propio departamento desechable y la
 * deja libre al terminar. */
function createDirectorEligibleUser(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}-director@ufps.edu.co`
  const password = 'Prueba-e2e-1!'
  const name = `Director de prueba ${marca}`

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
          name,
          active: true,
          avatar_url: '',
          institutional_code: marca,
          contract_type: 'Tiempo completo',
          roles: ['DOCENTE'],
        })
        .then((response) => {
          const id = (response.body as { data: { id: number } }).data.id

          return { uid, email, password, id, name }
        })
    })
}

/** Crea un departamento desechable y asigna `director` como su encargado.
 * Devuelve los ids que cada prueba necesita para verificar y limpiar. */
function assignFreshDirector(label: string) {
  return cy
    .api('POST', '/departments/', {
      name: `Departamento de prueba ${marca}-${label}`,
      code: `${marca}-${label}`,
      faculty_id: facultyId,
    })
    .then((response) => {
      const department = (response.body as { data: { id: number; code: string } }).data

      return cy
        .api('POST', `/departments/${department.id}/director`, { user_id: director.id })
        .then((assignResponse) => {
          const directorsRow = (assignResponse.body as { data: { id: number } }).data

          return { departmentId: department.id, departmentCode: department.code, directorsRow }
        })
    })
}

before(() => {
  cy.api('GET', '/faculties/?limit=1').then((response) => {
    const [faculty] = (response.body as { data: Array<{ id: number }> }).data
    facultyId = faculty.id
  })

  createDirectorEligibleUser().then((account) => {
    director = account
  })
})

after(() => {
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Administración de directores de departamento', () => {
  beforeEach(() => {
    cy.visitApp('/admin/directores', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/admin/directores')
  })

  it('busca y encuentra al director asignado, con su departamento y código', () => {
    assignFreshDirector('buscar').then(({ departmentId, departmentCode }) => {
      cy.get('input[placeholder="Buscar por nombre, correo o código..."]').type(director.name)

      cy.contains('tr', director.name, { timeout: 15000 }).within(() => {
        cy.contains(director.email).should('be.visible')
        cy.contains(marca).should('be.visible') // institutional_code, columna "Código"
        cy.contains(departmentCode).should('be.visible')
        cy.contains('Activo').should('be.visible')
      })

      cy.api('DELETE', `/departments/${departmentId}/director`)
      cy.api('DELETE', `/departments/${departmentId}`)
    })
  })

  it('elimina un director desde el listado: pierde el rol, no solo la fila', () => {
    assignFreshDirector('eliminar').then(({ departmentId }) => {
      cy.get('input[placeholder="Buscar por nombre, correo o código..."]').type(director.name)

      cy.contains('tr', director.name, { timeout: 15000 })
        .find('button[aria-label="Acciones"]')
        .click()
      cy.contains('Eliminar').click()

      cy.contains('Eliminar director').should('be.visible')
      cy.contains(director.name).should('be.visible')
      cy.contains('button', /^Eliminar$/).click()

      cy.contains('Director eliminado exitosamente').should('be.visible')

      cy.get('input[placeholder="Buscar por nombre, correo o código..."]')
        .clear()
        .type(director.name)
      cy.contains('tr', director.name).should('not.exist')

      // El bug que este RF destapó: no basta con que la fila desaparezca de
      // la tabla — el usuario debe dejar de ser director de verdad (pierde el
      // rol, conserva los demás) y el departamento debe quedar libre otra
      // vez, igual que al desasignar desde `/admin/departamentos`.
      cy.api('GET', `/users/?search=${director.email}&limit=1`).then((response) => {
        const [user] = (response.body as { data: Array<{ roles: string[] }> }).data
        expect(user.roles).to.deep.equal(['DOCENTE'])
      })

      cy.api('GET', `/departments/${departmentId}`).then((response) => {
        const department = (response.body as { data: { director: unknown } }).data
        expect(department.director).to.eq(null)
      })

      cy.api('DELETE', `/departments/${departmentId}`)
    })
  })
})
