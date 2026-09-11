/**
 * RF-5.7 (Media) — Listado de materias por periodo, con acceso directo al
 * detalle cuando un solo docente la dictó y comparación entre los docentes
 * cuando varios la dictaron bajo el mismo código.
 *
 * Corre contra la pila real. Departamento `99` fijo (ver `evaluationFixtures.ts`),
 * periodo `2026-1`:
 *   - "SISTEMAS OPERATIVOS" (código 1155604) la dicta un único docente real
 *     (DOCENTE 2) — atajo directo a "Ver detalle".
 *   - "FUNDAMENTOS DE PROGRAMACION" (código 1155104) la dictan dos docentes
 *     reales bajo el mismo código (DOCENTE 1 grupo A01, DOCENTE 2 grupo B01)
 *     — comparación real, no inventada.
 *
 * Las cifras no se hardcodean: se leen de
 * `GET /stats/departments/subjects/{code}/teachers-comparison` dentro de
 * cada prueba y se comparan contra lo que muestra la interfaz.
 */

import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

function fmt(value: number): string {
  return value.toFixed(2)
}

interface ComparisonEntry {
  teacher_id: number
  teacher_name: string
  overall_average: number
  dimensions: Array<{ dimension: string; average: number }>
}

let fixtureDepartment: { id: number }
let director: DirectorAccount

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('materias').then((account) => {
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

describe('Materias', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')
  })

  describe('un solo docente dicta la materia', () => {
    beforeEach(() => {
      cy.visit('/materias?period=2026-1')
      cy.contains('SISTEMAS OPERATIVOS', { timeout: 20000 }).should('be.visible')
    })

    it('un solo código bajo la materia salta directo al detalle del docente', () => {
      cy.contains('SISTEMAS OPERATIVOS').closest('button').click()

      // Un único código y un único grupo: el enlace ya es "Ver detalle", sin
      // pasar por una fila de código intermedia a expandir.
      cy.contains('1155604').should('be.visible')
      cy.contains('Ver detalle').should('be.visible').click()

      cy.contains('h1', 'SISTEMAS OPERATIVOS', { timeout: 20000 }).should('be.visible')
      cy.contains('DOCENTE 2').should('be.visible')
    })
  })

  describe('varios docentes dictan la misma materia', () => {
    beforeEach(() => {
      cy.visit('/materias?period=2026-1')
      cy.contains('FUNDAMENTOS DE PROGRAMACION', { timeout: 20000 }).should('be.visible')
    })

    it('expande la materia y muestra a los dos docentes con su promedio', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        '/stats/departments/subjects/1155104/teachers-comparison?period=2026-1',
      ).then((response) => {
        const entries = (response.body as { data: ComparisonEntry[] }).data
        expect(entries).to.have.length(2)

        cy.contains('FUNDAMENTOS DE PROGRAMACION').closest('button').click()

        cy.contains('1155104').should('be.visible')
        cy.contains('1155104').closest('button').click()

        cy.contains('2 docentes').should('be.visible')
        cy.contains('a', 'Comparar').should('be.visible')

        for (const entry of entries) {
          // Fila del docente: <p nombre> → <div envoltorio> → <div identidad>
          // → <div fila> (hermano del bloque que trae el promedio).
          cy.contains(entry.teacher_name)
            .parent()
            .parent()
            .parent()
            .should('contain.text', fmt(entry.overall_average))
        }
      })
    })

    it('compara el ranking y las dimensiones de los dos docentes', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        '/stats/departments/subjects/1155104/teachers-comparison?period=2026-1',
      ).then((response) => {
        const entries = (response.body as { data: ComparisonEntry[] }).data
        const [best, worst] = [...entries].sort((a, b) => b.overall_average - a.overall_average)

        cy.contains('FUNDAMENTOS DE PROGRAMACION').closest('button').click()
        cy.contains('1155104').closest('button').click()
        cy.contains('a', 'Comparar').click()

        cy.contains('h1', 'Comparación de docentes', { timeout: 20000 }).should('be.visible')

        cy.contains('h2', 'Ranking por promedio general')
          .parent()
          .next()
          .find('> div')
          .should(($rows) => {
            const texts = Cypress._.map($rows.toArray(), (row) => row.textContent ?? '')
            expect(texts[0], 'primer lugar').to.include(best.teacher_name)
            expect(texts[0], 'primer lugar').to.include(fmt(best.overall_average))
            expect(texts[1], 'segundo lugar').to.include(worst.teacher_name)
            expect(texts[1], 'segundo lugar').to.include(fmt(worst.overall_average))
          })

        // El mayor y el menor de verdad en "Desarrollo del Conocimiento" — el
        // mismo docente que gana el promedio general también gana esta
        // dimensión con estos dos fixtures reales, pero se calcula, no se
        // asume.
        const dimension = 'Desarrollo del Conocimiento'
        const [dimBest, dimWorst] = [...entries].sort(
          (a, b) =>
            b.dimensions.find((d) => d.dimension === dimension)!.average -
            a.dimensions.find((d) => d.dimension === dimension)!.average,
        )

        cy.contains('h3', dimension)
          .closest('section')
          .should('contain.text', 'Mayor nota:')
          .and('contain.text', dimBest.teacher_name)
          .and('contain.text', 'Menor nota:')
          .and('contain.text', dimWorst.teacher_name)
      })
    })
  })
})
