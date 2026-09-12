/**
 * RF-6.9 (Alta) — Formato 3 con sus puntos de control y sus notas de
 * seguimiento.
 *
 * Corre contra la pila real. La mecánica de registrar un corte ya está muy
 * bien probada en unitarias (`PlanCheckpoints.test.tsx`) — este spec confirma
 * el ciclo real: guardar de verdad persiste, la validación real bloquea un
 * guardado incompleto, y el docente lo ve de solo lectura.
 */

import { directorDepartmentId, ownTeacherId, seedPeriod, seedTeacher } from '../../support/planFixtures'

const marca = `${Date.now()}`

let otherTeacherId: number
let selfTeacherId: number
let periodId: number

function seedPlan() {
  return cy.api('POST', '/improvement-plans/', {
    teacher_id: otherTeacherId,
    origin_period_id: periodId,
    title: `Plan seguimientos ${marca}`,
    items: [
      { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
    ],
    courses: [{ course_name: 'Cálculo Diferencial' }],
  })
}

describe('Formato 3 — puntos de control', () => {
  let createdPlanIds: number[] = []

  before(() => {
    directorDepartmentId().then((departmentId) => {
      seedTeacher(`Docente Seguimientos ${marca}`, departmentId).then((id) => (otherTeacherId = id))
    })
    ownTeacherId().then((id) => (selfTeacherId = id))
    seedPeriod(`Periodo Seguimientos ${marca}`).then((id) => (periodId = id))

    // Un solo login real por UI para todo el spec, no uno por test: Firebase
    // limita cuántos `signInWithPassword` acepta por proyecto en una ventana
    // de tiempo (ver E2E.md "Problemas conocidos"). La sesión que deja este
    // login vive en la IndexedDB de Firebase, que Cypress no limpia entre
    // pruebas (solo cookies/localStorage), así que sigue ahí para el resto
    // del spec — ver `beforeEach`.
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  after(() => {
    cy.api('DELETE', `/teachers/${otherTeacherId}`)
    cy.api('DELETE', `/academic-periods/${periodId}`)
  })

  beforeEach(() => {
    createdPlanIds = []
    cy.watchApi()

    // Reaprovecha la sesión abierta en el before(): solo hace falta reponer
    // el rol (el localStorage sí se limpia entre pruebas) y aterrizar en
    // /home. Firebase restaura el usuario desde la IndexedDB que sigue ahí y
    // refresca el token (operación sin límite de cuota), sin pasar de nuevo
    // por el formulario de login.
    cy.visit('/home', {
      onBeforeLoad(win) {
        win.localStorage.setItem('selectedRole', 'DIRECTOR DE DEPARTAMENTO')
      },
    })
    cy.location('pathname').should('eq', '/home')
  })

  afterEach(() => {
    for (const id of createdPlanIds) {
      cy.api('DELETE', `/improvement-plans/${id}`)
    }
  })

  it('registrar un seguimiento persiste de verdad y se refleja en el Formato 3', () => {
    seedPlan().then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Primer seguimiento', { timeout: 20000 }).should('be.visible')
      cy.contains('0/1 aspectos registrados').should('be.visible')

      cy.contains('div', 'Primer seguimiento').parent().contains('button', 'Registrar').click()

      cy.contains('label', /Fecha del seguimiento/)
        .parent()
        .find('button')
        .click()
      cy.get('[data-slot="calendar"] button[data-day]:not([disabled])').first().click()

      cy.contains('label', /Desempeño Docente/)
        .parent()
        .find('textarea')
        .type('Mejoró notablemente la puntualidad')

      cy.contains('button', 'Guardar').click()

      cy.contains('1/1 aspectos registrados', { timeout: 20000 }).should('be.visible')
      cy.contains('button', 'Editar').should('be.visible')

      // El progreso real se refleja también en el Formato 3.
      cy.contains('Formato 3 · Plan de seguimiento').parent().should('contain.text', 'Semana 8')
    })
  })

  it('no deja guardar un seguimiento sin la observación del aspecto', () => {
    seedPlan().then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Primer seguimiento', { timeout: 20000 }).should('be.visible')

      cy.contains('div', 'Primer seguimiento').parent().contains('button', 'Registrar').click()
      cy.contains('button', 'Guardar').click()

      cy.contains('Falta la observación de este aspecto.').should('be.visible')
      cy.contains('Registra la fecha del seguimiento.').should('be.visible')
    })
  })

  it('el docente ve sus seguimientos de solo lectura', () => {
    cy.api('POST', '/improvement-plans/', {
      teacher_id: selfTeacherId,
      origin_period_id: periodId,
      title: `Plan propio seguimientos ${marca}`,
      items: [
        { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
      ],
      courses: [{ course_name: 'Cálculo Diferencial' }],
    }).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Cambiar de rol').click()
      cy.get('[data-slot="dropdown-menu-radio-item"]').contains('Docente').click()
      cy.location('pathname').should('eq', '/home')

      cy.visit(`/mis-planes/${planId}`)
      cy.contains('Primer seguimiento', { timeout: 20000 }).should('be.visible')
      cy.contains('button', 'Registrar').should('not.exist')
      cy.contains('button', 'Editar').should('not.exist')
    })
  })
})
