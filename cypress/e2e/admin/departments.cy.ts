/**
 * RF — El administrador debe poder crear, consultar, actualizar y eliminar
 * departamentos, y asignar o retirar el director de cada uno.
 *
 * Todo pasa por la interfaz contra la API real, en `/admin/departamentos`.
 * Como `/faculties/`, `/departments/` sí expone borrado real: cada prueba
 * prepara su propio departamento desechable por API (o por la interfaz, si es
 * justo lo que la prueba mide) y lo deja limpio.
 *
 * Las dos pruebas de director comparten una única cuenta de un solo rol
 * (`DOCENTE`), creada una vez en `before()` porque cada alta es un registro
 * real en Firebase — igual que en `security/department-isolation.cy.ts`.
 * Cada una la deja sin departamento asignado al terminar, para que sea
 * indiferente en qué orden corran: `POST /departments/{id}/director` rechaza
 * a un usuario que ya es director activo de otro departamento.
 *
 * Asignar añade el rol `DIRECTOR DE DEPARTAMENTO` al usuario; la prueba de
 * desasignación comprueba que retirarlo también quita ese rol, no solo la
 * fila de `directors` — de lo contrario el usuario seguiría operando como
 * director sin tener ningún departamento a cargo.
 */

const marca = `e2e-departamentos-${Date.now()}`

let facultyId: number

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
  name: string
}

/** Crea un departamento desechable por API, con nombre y código únicos. */
function createDepartment(label: string) {
  return cy
    .api('POST', '/departments/', {
      name: `Departamento de prueba ${marca}-${label}`,
      code: `${marca}-${label}`,
      faculty_id: facultyId,
    })
    .then((response) => (response.body as { data: { id: number; code: string } }).data)
}

/** Busca en la tabla, por código, y devuelve la fila del departamento. */
function findDepartment(code: string) {
  cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(code)

  return cy.contains('tr', code, { timeout: 15000 })
}

/** Abre el formulario de edición de un departamento desde su fila. */
function openEditDrawer(code: string) {
  findDepartment(code).find('button[aria-label="Acciones"]').click()
  cy.contains('Editar').click()

  return cy.contains('Editar departamento').should('be.visible')
}

/**
 * Elige una opción de un `<Select>` del formulario, ubicado por la etiqueta de
 * su campo. Las opciones se filtran por `:visible`: al cerrarse, el popup de
 * un select anterior sigue montado en el DOM con sus opciones dentro.
 */
function chooseOption(label: string, option?: string) {
  cy.contains('label', label).parent().find('[data-slot="select-trigger"]').click()

  if (option) {
    cy.contains('[data-slot="select-item"]:visible', option).click()
  } else {
    cy.get('[data-slot="select-item"]:visible').first().click()
  }
}

/** Crea, por API, una cuenta real de Firebase con rol `DOCENTE` — elegible
 * como director según filtra `AssignDirectorDrawer`. */
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

let director: DirectorAccount

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

describe('Administración de departamentos', () => {
  beforeEach(() => {
    cy.visitApp('/admin/departamentos', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/admin/departamentos')
  })

  it('crea un departamento nuevo y aparece en el listado, sin director', () => {
    const code = `${marca}-creado`

    cy.contains('button', 'Crear departamento').click()

    cy.get('#name').type(`Departamento creado por E2E ${code}`)
    cy.get('#code').type(code)
    chooseOption('Facultad')

    cy.contains('button', /^Crear$/).click()

    cy.contains('Departamento creado exitosamente').should('be.visible')

    findDepartment(code).within(() => {
      cy.contains(`Departamento creado por E2E ${code}`).should('be.visible')
      cy.contains('Sin asignar').should('be.visible')
      cy.contains('Activo').should('be.visible')
      cy.contains(/0\s*docentes?/).should('be.visible')
    })

    cy.api('GET', `/departments/?search=${code}&limit=1`).then((response) => {
      const [creado] = (response.body as { data: Array<{ id: number }> }).data
      cy.api('DELETE', `/departments/${creado.id}`)
    })
  })

  it('consulta el listado y lo encuentra por nombre o código', () => {
    createDepartment('consulta').then((departamento) => {
      findDepartment(departamento.code).within(() => {
        cy.contains(departamento.code).should('be.visible')
        cy.contains('Sin asignar').should('be.visible')
        cy.contains('Activo').should('be.visible')
      })

      cy.api('DELETE', `/departments/${departamento.id}`)
    })
  })

  it('actualiza el nombre, el código y el estado de un departamento', () => {
    createDepartment('editar').then((departamento) => {
      const nuevoCodigo = `${departamento.code}-v2`

      openEditDrawer(departamento.code)

      cy.get('#name').clear().type(`Departamento editado ${nuevoCodigo}`)
      cy.get('#code').clear().type(nuevoCodigo)
      cy.get('[data-slot="switch"]').should('have.attr', 'aria-checked', 'true').click()

      cy.contains('button', /^Guardar$/).click()

      cy.contains('Departamento actualizado exitosamente').should('be.visible')

      // El listado filtra por activos de forma predeterminada, así que el
      // departamento recién desactivado desaparece de la búsqueda por defecto.
      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(nuevoCodigo)
      cy.contains('tr', nuevoCodigo).should('not.exist')

      cy.api('DELETE', `/departments/${departamento.id}`)
    })
  })

  it('elimina un departamento y desaparece del listado', () => {
    createDepartment('eliminar').then((departamento) => {
      findDepartment(departamento.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Eliminar').click()

      cy.contains('Eliminar departamento').should('be.visible')
      cy.contains('button', /^Eliminar$/).click()

      cy.contains('Departamento eliminado exitosamente').should('be.visible')

      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(departamento.code)
      cy.contains('tr', departamento.code).should('not.exist')
    })
  })

  it('asigna un director desde el listado', () => {
    createDepartment('asignar').then((departamento) => {
      findDepartment(departamento.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Asignar director').click()

      cy.contains('Asignar director').should('be.visible')
      cy.get('input[aria-label="Buscar usuario"]').type(marca)
      cy.contains('button[aria-pressed]', director.name).click()
      cy.contains('button', 'Asignar director').click()

      cy.contains('Director asignado exitosamente').should('be.visible')

      findDepartment(departamento.code).within(() => {
        cy.contains(director.name).should('be.visible')
        cy.contains('Sin asignar').should('not.exist')
      })

      cy.api('DELETE', `/departments/${departamento.id}/director`)
      cy.api('DELETE', `/departments/${departamento.id}`)
    })
  })

  it('desasigna el director de un departamento', () => {
    createDepartment('desasignar').then((departamento) => {
      cy.api('POST', `/departments/${departamento.id}/director`, { user_id: director.id })

      findDepartment(departamento.code).within(() => {
        cy.contains(director.name).should('be.visible')
      })

      findDepartment(departamento.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Desasignar director').click()

      cy.contains('Desasignar director').should('be.visible')
      cy.contains('button', /^Desasignar$/).click()

      cy.contains('Director desasignado exitosamente').should('be.visible')

      findDepartment(departamento.code).within(() => {
        cy.contains('Sin asignar').should('be.visible')
      })

      // Asignar añade el rol `DIRECTOR DE DEPARTAMENTO` al usuario; desasignar
      // debe retirarlo también, no solo la fila de `directors` — si no,
      // seguiría viendo el menú de director sin serlo de ningún departamento.
      cy.api('GET', `/users/?search=${director.email}&limit=1`).then((response) => {
        const [user] = (response.body as { data: Array<{ roles: string[] }> }).data
        expect(user.roles).to.deep.equal(['DOCENTE'])
      })

      cy.api('DELETE', `/departments/${departamento.id}`)
    })
  })
})
