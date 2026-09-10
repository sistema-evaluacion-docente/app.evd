/**
 * RF — El administrador debe poder gestionar los programas académicos: crear,
 * consultar, actualizar y eliminar.
 *
 * Todo pasa por la interfaz contra la API real, en `/programas`. Igual que
 * facultades, `/programs/` expone borrado real, así que cada prueba prepara
 * su propio programa desechable por API y lo deja limpio.
 */

const marca = `e2e-programas-${Date.now()}`

/** Crea un programa desechable por API, con nombre y código únicos. */
function createProgram(label: string) {
  return cy
    .api('POST', '/programs/', {
      name: `Programa de prueba ${marca}-${label}`,
      code: `${marca}-${label}`,
    })
    .then((response) => (response.body as { data: { id: number; code: string } }).data)
}

/** Busca en la tabla, por código, y devuelve la fila del programa. */
function findProgram(code: string) {
  cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(code)

  return cy.contains('tr', code, { timeout: 15000 })
}

/** Abre el formulario de edición de un programa desde su fila. */
function openEditDrawer(code: string) {
  findProgram(code).find('button[aria-label="Acciones"]').click()
  cy.contains('Editar').click()

  return cy.contains(/^Editar programa:/).should('be.visible')
}

describe('Administración de programas académicos', () => {
  beforeEach(() => {
    cy.visitApp('/programas', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/programas')
  })

  it('crea un programa nuevo y aparece en el listado', () => {
    const code = `${marca}-creado`

    cy.contains('button', 'Crear programa').click()

    cy.get('#name').type(`Programa creado por E2E ${code}`)
    cy.get('#code').type(code)

    cy.contains('button', /^Crear$/).click()

    cy.contains('Programa creado exitosamente').should('be.visible')

    findProgram(code).within(() => {
      cy.contains(`Programa creado por E2E ${code}`).should('be.visible')
      cy.contains('Activo').should('be.visible')
    })

    cy.api('GET', `/programs/?search=${code}&limit=1`).then((response) => {
      const [creado] = (response.body as { data: Array<{ id: number }> }).data
      cy.api('DELETE', `/programs/${creado.id}`)
    })
  })

  it('consulta el listado y lo encuentra por nombre o código', () => {
    createProgram('consulta').then((programa) => {
      findProgram(programa.code).within(() => {
        cy.contains(programa.code).should('be.visible')
        cy.contains('Activo').should('be.visible')
      })

      cy.api('DELETE', `/programs/${programa.id}`)
    })
  })

  it('actualiza el nombre, el código y el estado de un programa', () => {
    createProgram('editar').then((programa) => {
      const nuevoCodigo = `${programa.code}-v2`

      openEditDrawer(programa.code)

      cy.get('#name').clear().type(`Programa editado ${nuevoCodigo}`)
      cy.get('#code').clear().type(nuevoCodigo)
      cy.get('[data-slot="switch"]').should('have.attr', 'aria-checked', 'true').click()

      cy.contains('button', /^Guardar$/).click()

      cy.contains('Programa actualizado exitosamente').should('be.visible')

      // El listado filtra por activos de forma predeterminada, así que el
      // programa recién desactivado desaparece de la búsqueda por defecto.
      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(nuevoCodigo)
      cy.contains('tr', nuevoCodigo).should('not.exist')

      cy.api('DELETE', `/programs/${programa.id}`)
    })
  })

  it('elimina un programa y desaparece del listado', () => {
    createProgram('eliminar').then((programa) => {
      findProgram(programa.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Eliminar').click()

      cy.contains('Eliminar programa').should('be.visible')
      cy.contains('button', /^Eliminar$/).click()

      cy.contains('Programa eliminado exitosamente').should('be.visible')

      cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(programa.code)
      cy.contains('tr', programa.code).should('not.exist')
    })
  })
})
