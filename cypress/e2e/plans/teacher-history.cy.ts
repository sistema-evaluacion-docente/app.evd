/**
 * RF-6.5 (Media) — Consulta de los cursos y del historial de planes de un
 * docente.
 *
 * Corre contra la pila real. `/docentes/:id?period=...` necesita una
 * evaluación real cargada para ese departamento y periodo — no alcanza con
 * un docente y un periodo desechables por API (ver `planFixtures.ts`) — así
 * que este spec usa el departamento `99` fijo y sus dos periodos reales
 * (ver `evaluationFixtures.ts`), con un director desechable propio.
 *
 * Docentes reales usados, con su situación confirmada contra la API antes de
 * escribir estas pruebas:
 *   - DOCENTE 1: se le siembran dos planes reales, en 2025-2 y 2026-1, para
 *     probar el historial cruzando periodos.
 *   - DOCENTE 2: se le siembra un plan solo en 2025-2, para ver la ficha de
 *     2026-1 sin plan propio pero con historial en otros periodos.
 *   - DOCENTE 3: sin ningún plan, para confirmar que sin historial no se
 *     ofrece "Ver historial".
 */

import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

const marca = `${Date.now()}`

let fixtureDepartment: { id: number }
let director: DirectorAccount
let teacherIds: { docente1: number; docente2: number; docente3: number }

function seedPlan(teacherId: number, periodId: number, title: string) {
  return cy.apiAs(director.email, director.password, 'POST', '/improvement-plans/', {
    teacher_id: teacherId,
    origin_period_id: periodId,
    title,
    acta_number: '099',
    acta_date: '2026-01-15',
    items: [{ description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 }],
    courses: [{ course_name: 'Cálculo Diferencial' }],
  })
}

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('historial').then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
      seedFixtureEvaluations(account).then((seeded) => {
        teacherIds = seeded.teacherIds
      })
    })
  })
})

after(() => {
  cy.apiAs(
    director.email,
    director.password,
    'GET',
    `/improvement-plans/?department_id=${fixtureDepartment.id}&period=todos&limit=100`,
  ).then((response) => {
    const plans = (response.body as { data: Array<{ id: number }> }).data
    for (const plan of plans) {
      cy.apiAs(director.email, director.password, 'DELETE', `/improvement-plans/${plan.id}`)
    }
  })
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

describe('Cursos e historial de planes de un docente', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')
  })

  it('muestra el historial cruzando periodos, con los dos planes reales del docente', () => {
    const title2025 = `Historial 2025-2 ${marca}`
    const title2026 = `Historial 2026-1 ${marca}`

    cy.apiAs(
      director.email,
      director.password,
      'GET',
      `/improvement-plans/periods?department_id=${fixtureDepartment.id}`,
    ).then((response) => {
      const periods = (response.body as { data: Array<{ id: number; code: string }> }).data
      const period2025 = periods.find((p) => p.code === '2025-2')!
      const period2026 = periods.find((p) => p.code === '2026-1')!

      seedPlan(teacherIds.docente1, period2025.id, title2025)
      seedPlan(teacherIds.docente1, period2026.id, title2026)

      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains('DOCENTE 1', { timeout: 20000 }).should('be.visible')

      cy.contains('Plan de mejoramiento').parent().should('contain.text', title2026)
      cy.contains('button', 'Ver plan').should('be.visible')

      cy.contains('button', 'Ver historial').click()

      cy.location('pathname', { timeout: 20000 }).should('eq', '/planes')
      cy.location('search').should('include', 'periodo=todos')
      cy.contains(title2025, { timeout: 20000 }).should('be.visible')
      cy.contains(title2026).should('be.visible')
    })
  })

  it('sin plan en el periodo mostrado pero con historial en otros, ofrece crear uno y ver el historial', () => {
    const title2025 = `Sin plan aquí ${marca}`

    cy.apiAs(
      director.email,
      director.password,
      'GET',
      `/improvement-plans/periods?department_id=${fixtureDepartment.id}`,
    ).then((response) => {
      const periods = (response.body as { data: Array<{ id: number; code: string }> }).data
      const period2025 = periods.find((p) => p.code === '2025-2')!

      seedPlan(teacherIds.docente2, period2025.id, title2025)

      cy.visit(`/docentes/${teacherIds.docente2}?period=2026-1`)
      cy.contains('DOCENTE 2', { timeout: 20000 }).should('be.visible')

      cy.contains('Sin plan en el periodo 2026-1').should('be.visible')
      cy.contains('1 plan en otros periodos').should('be.visible')

      cy.contains('button', 'Crear plan de mejoramiento').should('be.visible')
      cy.contains('button', 'Ver historial').click()

      cy.location('pathname', { timeout: 20000 }).should('eq', '/planes')
      cy.contains(title2025, { timeout: 20000 }).should('be.visible')
    })
  })

  it('sin ningún plan, no ofrece ver un historial que no existe', () => {
    cy.visit(`/docentes/${teacherIds.docente3}?period=2026-1`)
    cy.contains('DOCENTE 3', { timeout: 20000 }).should('be.visible')

    cy.contains('Este docente no tiene un plan de seguimiento registrado.').should('be.visible')
    cy.contains('button', 'Ver historial').should('not.exist')
    cy.contains('button', 'Crear plan de mejoramiento').should('be.visible')
  })
})
