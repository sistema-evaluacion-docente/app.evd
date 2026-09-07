/**
 * RF — El administrador debe poder crear, consultar, actualizar y eliminar
 * facultades.
 *
 * Todo pasa por la interfaz contra la API real, en `/admin/facultades`. A
 * diferencia de usuarios, `/faculties/` sí expone borrado real, así que cada
 * prueba prepara su propia facultad desechable por API y la deja limpia: la
 * de "crear" y la de "eliminar" no dejan nada detrás, y la de "actualizar" y
 * "consultar" borran la suya al terminar.
 */

const marca = `e2e-facultades-${Date.now()}`

/** Crea una facultad desechable por API, con nombre y código únicos. */
function createFaculty(label: string) {
  return cy
    .api('POST', '/faculties/', {
      name: `Facultad de prueba ${marca}-${label}`,
      code: `${marca}-${label}`,
    })
    .then((response) => (response.body as { data: { id: number; code: string } }).data)
}

/** Busca en la tabla, por código, y devuelve la fila de la facultad. */
function findFaculty(code: string) {
  cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(code)

  return cy.contains('tr', code, { timeout: 15000 })
}

/** Abre el formulario de edición de una facultad desde su fila. */
function openEditDrawer(code: string) {
  findFaculty(code).find('button[aria-label="Acciones"]').click()
  cy.contains('Editar').click()

  return cy.contains('Editar facultad').should('be.visible')
}

describe('Administración de facultades', () => {
  beforeEach(() => {
    cy.visitApp('/admin/facultades', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/admin/facultades')
  })

  it('crea una facultad nueva y aparece en el listado', () => {
    const code = `${marca}-creada`

    cy.contains('button', 'Crear facultad').click()

    cy.get('#name').type(`Facultad creada por E2E ${code}`)
    cy.get('#code').type(code)

    cy.contains('button', /^Crear$/).click()

    cy.contains('Facultad creada exitosamente').should('be.visible')

    findFaculty(code).within(() => {
      cy.contains(`Facultad creada por E2E ${code}`).should('be.visible')
      cy.contains('Activo').should('be.visible')
      cy.contains(/0\s*departamentos/).should('be.visible')
    })

    cy.api('GET', `/faculties/?search=${code}&limit=1`).then((response) => {
      const [creada] = (response.body as { data: Array<{ id: number }> }).data
      cy.api('DELETE', `/faculties/${creada.id}`)
    })
  })

  it('consulta el listado y lo encuentra por nombre o código', () => {
    createFaculty('consulta').then((facultad) => {
      findFaculty(facultad.code).within(() => {
        cy.contains(facultad.code).should('be.visible')
        cy.contains('Activo').should('be.visible')
        cy.contains(/0\s*departamentos/).should('be.visible')
      })

      cy.api('DELETE', `/faculties/${facultad.id}`)
    })
  })

  it('actualiza el nombre, el código y el estado de una facultad', () => {
    createFaculty('editar').then((facultad) => {
      const nuevoCodigo = `${facultad.code}-v2`

      openEditDrawer(facultad.code)

      cy.get('#name').clear().type(`Facultad editada ${nuevoCodigo}`)
      cy.get('#code').clear().type(nuevoCodigo)
      cy.get('[data-slot="switch"]').should('have.attr', 'aria-checked', 'true').click()

      cy.contains('button', /^Guardar$/).click()

      cy.contains('Facultad actualizada exitosamente').should('be.visible')

      // El listado filtra por activas de forma predeterminada, así que la
      // facultad recién desactivada desaparece de la búsqueda por defecto.
      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(nuevoCodigo)
      cy.contains('tr', nuevoCodigo).should('not.exist')

      cy.api('DELETE', `/faculties/${facultad.id}`)
    })
  })

  it('elimina una facultad y desaparece del listado', () => {
    createFaculty('eliminar').then((facultad) => {
      findFaculty(facultad.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Eliminar').click()

      cy.contains('Eliminar facultad').should('be.visible')
      cy.contains('button', /^Eliminar$/).click()

      cy.contains('Facultad eliminada exitosamente').should('be.visible')

      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(facultad.code)
      cy.contains('tr', facultad.code).should('not.exist')
    })
  })
})
