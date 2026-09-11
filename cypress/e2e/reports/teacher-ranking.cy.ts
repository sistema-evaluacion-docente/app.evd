/**
 * RF-5.6 (Media) — Ranking de desempeño paginado y ordenable.
 *
 * La lista de docentes en `/docentes`, ordenada por su promedio de mayor a
 * menor (o al revés) y paginada. Corre contra la pila real: el departamento
 * "Sistemas" tiene 6 docentes reales con promedio en el periodo 2026-1 —
 * 5 de la evaluación sembrada más uno agregado a mano para poder probar una
 * segunda página de verdad (con 5 el tamaño de página más chico disponible
 * ya los mostraba todos en una sola).
 *
 * Orden real, de mayor a menor promedio, en 2026-1:
 *   1. Orlando José Beltrán Valero   4.51
 *   2. Marco Antonio Adarme Jaimes   4.39
 *   3. Mauricio Di Donato Sanchez    3.9 (frontera de redondeo — no se
 *      afirma el número exacto, solo su posición)
 *   4. Julian Alfonso Rodriguez Castro TP   3.57
 *   5. Sofia Valentina Moreno Ruiz   3.20
 *   6. Perez Perez HC                3.08
 */

/** Abre el popover de orden y elige campo + dirección. */
function sortBy(field: string, direction: 'Desc' | 'Asc') {
  cy.get('[title="Ordenar por"]').find('button').first().click()
  cy.contains('button', field).click()
  cy.contains('button', direction).click()
  cy.contains('button', 'Aplicar').click()
}

/**
 * Nombres de los docentes, en el orden en que aparecen en la tabla — con
 * reintento. Aplicar el orden no repinta la tabla al instante: el filtro
 * pasa por 400ms de debounce antes de disparar la nueva consulta, así que
 * leer las filas una sola vez (con `.then()`) puede capturar la respuesta
 * todavía vieja. Envolver la lectura en el `predicate` de un `.should()` la
 * pone bajo el reintento automático de Cypress: seguirá reintentando hasta
 * que la aserción pase o venza el timeout, no solo hasta que la tabla tenga
 * filas.
 */
function assertTeacherOrder(
  expectedInOrder: string[],
  /** Promedio esperado por docente, comprobado en la misma pasada. */
  expectedAverages: Record<string, string> = {},
) {
  cy.get('tbody tr').should(($rows) => {
    const rowTexts = Cypress._.map($rows.toArray(), (row) => row.textContent ?? '')
    const order = rowTexts.map(
      (text) =>
        ['Orlando', 'Marco Antonio', 'Mauricio', 'Julian', 'Sofia', 'Perez'].find((who) =>
          text.toUpperCase().includes(who.toUpperCase()),
        ) ?? text,
    )

    expect(order.slice(0, expectedInOrder.length)).to.deep.equal(expectedInOrder)

    for (const [who, average] of Object.entries(expectedAverages)) {
      const rowText = rowTexts.find((text) => text.toUpperCase().includes(who.toUpperCase()))
      expect(rowText, `fila de ${who}`).to.include(average)
    }
  })
}

describe('Ranking de docentes', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')

    cy.visit('/docentes?period=2026-1')
    // El árbol de la tabla también tarda en compilarse la primera vez de la
    // corrida — mismo motivo que en department-summary.cy.ts. Los nombres
    // reales no llevan tildes (así salieron del PDF), todo en mayúsculas.
    cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')
  })

  it('ordena a los docentes de mayor a menor promedio', () => {
    sortBy('Promedio', 'Desc')

    assertTeacherOrder(
      ['Orlando', 'Marco Antonio', 'Mauricio', 'Julian', 'Sofia', 'Perez'],
      { Orlando: '4.51', 'Marco Antonio': '4.39' },
    )
  })

  it('ordena a los docentes de menor a mayor promedio', () => {
    sortBy('Promedio', 'Asc')

    // La página por defecto (10) muestra a los 6 — el orden es justo el
    // reverso del descendente.
    assertTeacherOrder(['Perez', 'Sofia', 'Julian', 'Mauricio', 'Marco Antonio', 'Orlando'])
  })

  it('pagina cuando hay más docentes de los que caben en una página', () => {
    sortBy('Promedio', 'Desc')
    assertTeacherOrder(['Orlando'])

    // Reduce el tamaño de página al mínimo disponible (5) para que los 6
    // docentes reales de verdad requieran una segunda página.
    cy.contains('Filas por página').parent().find('button').click()
    cy.contains('button, [role="menuitemradio"], [data-slot="dropdown-menu-item"]', '5').click()

    cy.contains(/Página 1 de 2/).should('be.visible')
    cy.contains('tr', 'ORLANDO').should('be.visible')
    cy.contains('tr', 'PEREZ').should('not.exist')

    cy.get('button[aria-label="Página siguiente"]').click()

    cy.contains(/Página 2 de 2/).should('be.visible')
    cy.contains('tr', 'PEREZ').should('be.visible')
    cy.contains('tr', 'ORLANDO').should('not.exist')
  })
})
