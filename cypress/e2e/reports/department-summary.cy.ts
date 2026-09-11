/**
 * RF-5.1 (Alta) — Promedios del departamento por periodo y contraste del
 * periodo actual con el anterior.
 * RF-5.2 (Alta) — Reporte del departamento por rango de periodos, en su
 * versión general y en la versión por materias.
 *
 * Corre contra la pila real. El departamento es el `99` fijo que traen
 * impresos los dos PDF reales y anonimizados de `cypress/files/` (ver
 * `evaluationFixtures.ts`) — dos periodos reales, `2025-2` y `2026-1`, así
 * que el contraste entre ambos (RF-5.1) es un dato de verdad, no inventado.
 * El contraste automático contra el periodo inmediatamente anterior está
 * deshabilitado en el código (ver "MOVER BADGES DISABLED" en
 * `DepartmentPeriodRangeSummary.tsx`) a la espera de un arreglo del backend,
 * así que se prueba a través de "Comparar un rango de periodos".
 *
 * Las cifras no se hardcodean: se leen de la propia API dentro de cada
 * prueba y se comparan contra lo que muestra la interfaz — más robusto que
 * un número fijo, porque el fixture se sube fresco en cada corrida.
 */

import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

function landOnSummary() {
  cy.contains('h2', 'Testing', { timeout: 20000 }).should('be.visible')
}

function pickPeriodOption(code: string) {
  cy.contains('[data-slot="select-item"]:visible', code).click({ force: true })
}

/** Redondea igual que la interfaz (2 decimales), para comparar contra el texto que pinta. */
function fmt(value: number): string {
  return value.toFixed(2)
}

let fixtureDepartment: { id: number }
let director: DirectorAccount

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('resumen').then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
      seedFixtureEvaluations(account)
    })
  })
})

after(() => {
  cy.apiAs(director.email, director.password, 'GET', '/evaluations/?department_id=' + fixtureDepartment.id).then(
    (response) => {
      const evaluations = (response.body as { data: Array<{ id: number }> }).data
      for (const evaluation of evaluations) {
        cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${evaluation.id}`)
      }
    },
  )
  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Resumen del departamento', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')
  })

  describe('RF-5.1 — Promedios por periodo', () => {
    it('muestra el departamento y el promedio del periodo más reciente por defecto', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/stats/departments/period-range?department_id=${fixtureDepartment.id}&start_period=2026-1&end_period=2026-1`,
      ).then((response) => {
        const stats = (response.body as { data: { overall_average: number } }).data

        landOnSummary()
        cy.contains('Periodo evaluado').parent().should('contain.text', '2026-1')
        cy.contains('Promedio general').next().should('contain.text', fmt(stats.overall_average))
      })
    })

    it('contrasta el periodo actual con el anterior al comparar un rango', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/stats/departments/period-range?department_id=${fixtureDepartment.id}&start_period=2025-2&end_period=2026-1`,
      ).then((response) => {
        const stats = (response.body as { data: { overall_average: number } }).data

        landOnSummary()
        cy.get('[data-slot="switch"]').click()

        cy.get('[aria-label="Periodo inicial"]').click()
        pickPeriodOption('2025-2')

        cy.get('[aria-label="Periodo final"]').click()
        pickPeriodOption('2026-1')

        cy.contains('Periodo evaluado').parent().should('contain.text', '2025-2 — 2026-1')
        cy.contains('Promedio general').next().should('contain.text', fmt(stats.overall_average))

        cy.contains('h2', 'Evolución del promedio por periodo').should('be.visible')
        cy.contains('2025-2').should('be.visible')
        cy.contains('2026-1').should('be.visible')
      })
    })
  })

  describe('RF-5.2 — Reporte por rango de periodos', () => {
    it('pide la API con el rango exacto elegido', () => {
      landOnSummary()

      // Con solo dos periodos reales, el rango por defecto al activar el
      // switch ya es "2025-2 — 2026-1" (el periodo anterior al actual) —
      // elegir "2025-2" a mano no cambiaría nada que disparar. El intercept
      // va antes del clic para capturar esa primera petición real.
      cy.intercept('**/stats/departments/period-range*').as('rangeRequest')
      cy.get('[data-slot="switch"]').click()

      cy.wait('@rangeRequest').its('request.url').should('include', 'start_period=2025-2')
    })

    it('ofrece descargar el reporte del departamento una vez hay datos', () => {
      landOnSummary()
      cy.contains('button', 'Descargar reporte del departamento').should('be.enabled')
    })

    describe('versión por materias', () => {
      beforeEach(() => {
        cy.visit('/materias?period=2026-1')
      })

      it('lista las materias del periodo con su promedio y número de docentes', () => {
        cy.contains('FUNDAMENTOS DE PROGRAMACION', { timeout: 20000 }).should('be.visible')
        // La dictan DOCENTE 1 (grupo A01) y DOCENTE 2 (grupo B01) bajo el
        // mismo código real (1155104).
        cy.contains('2 docentes').should('be.visible')
      })

      it('expande una materia y muestra los docentes que la dictan', () => {
        cy.contains('FUNDAMENTOS DE PROGRAMACION', { timeout: 20000 }).closest('button').click()

        cy.contains('1155104').should('be.visible')
        cy.contains('1155104').closest('button').click()

        cy.contains('DOCENTE 1').should('be.visible')
        cy.contains('DOCENTE 2').should('be.visible')
      })
    })
  })
})
