/**
 * RF — El administrador crea usuarios, los lista, reemplaza sus roles y activa
 * o desactiva su estado.
 *
 * Todo pasa por la interfaz contra la API real. La API solo se usa directamente
 * para dejar preparado el usuario sobre el que se opera y para desactivarlo al
 * final: crear a mano por la interfaz en cada prueba dejaría un rastro mucho
 * mayor en una base de datos que no tiene endpoint para borrar.
 */

const marca = `e2e-${Date.now()}`

/** Usuario preparado por API, con `uid` propio para poder limpiarlo después. */
const usuario = {
  uid: `${marca}-uid`,
  email: `${marca}@ufps.edu.co`,
  name: `Usuario de prueba ${marca}`,
  code: `E2E-${marca}`,
}

/** Busca en la tabla y devuelve la fila del usuario. */
function findUser(email: string) {
  cy.get('input[placeholder*="Buscar por nombre"]').clear().type(email)

  return cy.contains('tr', email, { timeout: 15000 })
}

/** Abre el formulario de edición de un usuario desde su fila. */
function openEditDrawer(email: string) {
  findUser(email).find('button[aria-label="Acciones"]').click()
  cy.contains('Editar').click()

  return cy.contains('Editar usuario').should('be.visible')
}

/**
 * Elige una opción de un `<Select>` del formulario, ubicado por la etiqueta de
 * su campo. Las opciones se filtran por `:visible` a propósito: al cerrarse, el
 * popup de un select anterior sigue montado en el DOM con sus opciones dentro,
 * y sin el filtro el clic acaba en una opción invisible del select equivocado.
 */
function chooseOption(label: string, option?: string) {
  cy.contains('label', label).parent().find('[data-slot="select-trigger"]').click()

  if (option) {
    cy.contains('[data-slot="select-item"]:visible', option).click()
  } else {
    cy.get('[data-slot="select-item"]:visible').first().click()
  }
}

/** Marca o desmarca un rol en el selector múltiple del formulario. */
function toggleRole(label: string, selected: boolean) {
  cy.contains('button[aria-pressed]', label).should('have.attr', 'aria-pressed', String(!selected))
  cy.contains('button[aria-pressed]', label).click()
  cy.contains('button[aria-pressed]', label).should('have.attr', 'aria-pressed', String(selected))
}

describe('Administración de usuarios', () => {
  before(() => {
    cy.api('GET', '/departments/?page=1&limit=1').then((response) => {
      const [departamento] = (response.body as { data: Array<{ id: number }> }).data

      cy.api('POST', '/users/', {
        uid: usuario.uid,
        email: usuario.email,
        name: usuario.name,
        active: true,
        avatar_url: '',
        institutional_code: usuario.code,
        contract_type: 'Tiempo completo',
        department_id: departamento.id,
        roles: ['DOCENTE'],
      })
    })
  })

  after(() => {
    // La API no expone borrado, así que lo más limpio que se puede dejar es
    // inactivo y fuera del listado por defecto.
    cy.api('PATCH', `/users/${usuario.uid}/status`, { active: false })
  })

  beforeEach(() => {
    // Cada prueba arranca con el usuario preparado en un estado conocido, para
    // que ninguna dependa de lo que hizo la anterior.
    cy.api('PUT', `/users/${usuario.uid}/roles`, { roles: ['DOCENTE'] })
    cy.api('PATCH', `/users/${usuario.uid}/status`, { active: true })

    cy.visitApp('/admin/usuarios', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/admin/usuarios')
  })

  it('lista los usuarios y permite buscarlos', () => {
    cy.contains('h1, h2', 'Usuarios').should('be.visible')
    cy.get('tbody tr').should('have.length.at.least', 1)

    findUser(usuario.email).within(() => {
      cy.contains(usuario.name).should('be.visible')
      cy.contains(usuario.code).should('be.visible')
      cy.contains('Docente').should('be.visible')
      cy.contains('Activo').should('be.visible')
    })
  })

  it('crea un usuario nuevo y aparece en el listado', () => {
    const nuevo = `${marca}-creado`

    cy.contains('button', 'Crear usuario').click()

    cy.get('#name').type(`Creado por E2E ${nuevo}`)
    cy.get('#email').type(`${nuevo}@ufps.edu.co`)
    cy.get('#institutional_code').type(`E2E-${nuevo}`)

    chooseOption('Tipo de contrato', 'Tiempo completo')
    chooseOption('Departamento')

    toggleRole('Docente', true)

    cy.contains('button', /^Crear$/).click()

    cy.contains('Usuario creado exitosamente').should('be.visible')

    findUser(`${nuevo}@ufps.edu.co`).within(() => {
      cy.contains('Docente').should('be.visible')
      cy.contains('Activo').should('be.visible')
    })
  })

  it('rechaza un correo que no es institucional', () => {
    cy.contains('button', 'Crear usuario').click()

    cy.get('#name').type('Correo ajeno')
    cy.get('#email').type('alguien@gmail.com')
    cy.get('#institutional_code').type('E2E-CORREO')

    chooseOption('Tipo de contrato', 'Tiempo completo')
    chooseOption('Departamento')

    toggleRole('Docente', true)

    cy.contains('button', /^Crear$/).click()

    cy.contains('El correo debe terminar en @ufps.edu.co').should('be.visible')
    cy.contains('Crear usuario').should('be.visible')
  })

  it('exige al menos un rol', () => {
    cy.contains('button', 'Crear usuario').click()

    cy.get('#name').type('Sin roles')
    cy.get('#email').type(`${marca}-sin-roles@ufps.edu.co`)
    cy.get('#institutional_code').type('E2E-SIN-ROLES')

    chooseOption('Tipo de contrato', 'Tiempo completo')
    chooseOption('Departamento')

    cy.contains('button', /^Crear$/).click()

    cy.contains('Debe seleccionar al menos un rol').should('be.visible')
  })

  // Se cambia entre Docente y Director a propósito, sin pasar por Administrador:
  // la API nunca retira el rol ADMIN de quien ya lo tiene, así que usarlo aquí
  // probaría un reemplazo que el backend no llega a hacer.
  it('reemplaza los roles de un usuario', () => {
    openEditDrawer(usuario.email)

    toggleRole('Director de departamento', true)
    toggleRole('Docente', false)

    cy.contains('button', /^Guardar$/).click()

    cy.contains('Usuario actualizado exitosamente').should('be.visible')

    findUser(usuario.email).within(() => {
      cy.contains('Director de departamento').should('be.visible')
      cy.contains('Docente').should('not.exist')
    })
  })

  it('desactiva a un usuario y lo saca del listado activo', () => {
    openEditDrawer(usuario.email)

    cy.get('[data-slot="switch"]').should('have.attr', 'aria-checked', 'true').click()

    cy.contains('button', /^Guardar$/).click()

    cy.contains('Usuario actualizado exitosamente').should('be.visible')

    // El listado filtra por activos, así que el usuario desaparece de él.
    cy.get('input[placeholder*="Buscar por nombre"]').clear().type(usuario.email)
    cy.contains('tr', usuario.email).should('not.exist')
  })

  it('vuelve a activar a un usuario desactivado', () => {
    cy.api('PATCH', `/users/${usuario.uid}/status`, { active: false })

    cy.contains('button', 'Filtros').click()
    cy.get('[data-slot="switch"]').click()
    cy.contains('button', 'Filtros').click()

    openEditDrawer(usuario.email)

    cy.get('[data-slot="switch"]').should('have.attr', 'aria-checked', 'false').click()

    cy.contains('button', /^Guardar$/).click()

    cy.contains('Usuario actualizado exitosamente').should('be.visible')
  })
})
