/**
 * RF-5.6 (Media) — Ranking de desempeño paginado y ordenable.
 *
 * La lista de docentes en `/docentes`, ordenada por su promedio de mayor a
 * menor (o al revés). Corre contra la pila real, departamento `99` fijo (ver
 * `evaluationFixtures.ts`), periodo `2026-1` — 3 docentes reales
 * (DOCENTE 1/2/3), con sus promedios leídos de la propia API dentro de cada
 * prueba, no hardcodeados.
 *
 * La paginación (RF-5.6, "pagina cuando hay más docentes de los que caben en
 * una página") queda fuera de este archivo por ahora: el tamaño de página
 * más chico disponible es 5 y este fixture solo trae 3 docentes reales
 * evaluados — no hay forma de forzar una segunda página sin más PDFs reales
 * con más docentes.
 */

import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

interface TeacherWithAverage {
  id: number
  user: { name: string } | null
  overall_average: number | null
}

/** Abre el popover de orden y elige campo + dirección. */
function sortBy(field: string, direction: 'Desc' | 'Asc') {
  cy.get('[title="Ordenar por"]').find('button').first().click()
  cy.contains('button', field).click()
  cy.contains('button', direction).click()
  cy.contains('button', 'Aplicar').click()
}

/**
 * Nombres de los docentes, en el orden en que aparecen en la tabla — con
 * reintento, porque aplicar el orden pasa por 400ms de debounce antes de
 * disparar la nueva consulta.
 */
function assertTeacherOrder(expectedNamesInOrder: string[]) {
  cy.get('tbody tr').should(($rows) => {
    const rowTexts = Cypress._.map($rows.toArray(), (row) => row.textContent ?? '')
    const order = rowTexts.map(
      (text) =>
        expectedNamesInOrder.find((name) => text.toUpperCase().includes(name.toUpperCase())) ??
        text,
    )

    expect(order.slice(0, expectedNamesInOrder.length)).to.deep.equal(expectedNamesInOrder)
  })
}

let fixtureDepartment: { id: number }
let director: DirectorAccount

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('ranking').then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
      seedFixtureEvaluations(account)
    })
  })
})

after(() => {
  cy.apiAs(
    director.email,
    director.password,
    'GET',
    `/evaluations/?department_id=${fixtureDepartment.id}`,
  ).then((response) => {
    const evaluations = (response.body as { data: Array<{ id: number }> }).data
    for (const evaluation of evaluations) {
      cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${evaluation.id}`)
    }
  })
  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Ranking de docentes', () => {
  let orderedNames: string[] = []

  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')

    cy.apiAs(
      director.email,
      director.password,
      'GET',
      `/improvement-plans/periods?department_id=${fixtureDepartment.id}`,
    ).then((periodsResponse) => {
      const periods = (periodsResponse.body as { data: Array<{ id: number; code: string }> }).data
      const period2026 = periods.find((p) => p.code === '2026-1')!

      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/teachers/with-averages?department_id=${fixtureDepartment.id}&academic_period_id=${period2026.id}&limit=100`,
      ).then((teachersResponse) => {
        const teachers = (teachersResponse.body as { data: TeacherWithAverage[] }).data
        orderedNames = [...teachers]
          .sort((a, b) => (b.overall_average ?? 0) - (a.overall_average ?? 0))
          .map((t) => t.user!.name)
      })
    })

    cy.visit(`/docentes?period=2026-1`)
    cy.contains(orderedNames[0] ?? 'DOCENTE', { timeout: 20000 }).should('be.visible')
  })

  it('ordena a los docentes de mayor a menor promedio', () => {
    sortBy('Promedio', 'Desc')
    assertTeacherOrder(orderedNames)
  })

  it('ordena a los docentes de menor a mayor promedio', () => {
    sortBy('Promedio', 'Asc')
    assertTeacherOrder([...orderedNames].reverse())
  })
})
