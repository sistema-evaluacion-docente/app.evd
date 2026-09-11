/**
 * RF-6.11 (Alta) — Ciclo de evidencias con solicitud, entrega, hilo de
 * comentarios y decisión de aprobación o rechazo.
 * RF-6.12 (Alta) — Paso a EN_REVISION al entregar y regreso a PENDIENTE al
 * rechazar, con comentario de sistema y notificación a la contraparte.
 *
 * Corre contra la pila real. La cuenta de pruebas hace de directora Y de
 * docente del mismo plan (`teacher_id` 1, la misma cuenta) — el propio
 * backend está pensado para eso, así que un solo login real recorre las dos
 * puntas del ciclo cambiando de rol, sin necesitar una segunda cuenta.
 *
 * El envío del correo asociado ya quedó probado en RF-7.2
 * (`plan-emails.cy.ts`) — aquí el foco es el ciclo de estados y el hilo.
 */

import { ownTeacherId, seedPeriod } from '../../support/planFixtures'

const marca = `${Date.now()}`

function fakePdf(name: string) {
  return {
    contents: Cypress.Buffer.from('%PDF-1.4 contenido de prueba'),
    fileName: name,
    mimeType: 'application/pdf',
  }
}

let teacherId: number
let periodId: number

function seedPlan(title: string) {
  return cy.api('POST', '/improvement-plans/', {
    teacher_id: teacherId,
    origin_period_id: periodId,
    title,
    items: [
      { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
    ],
    courses: [{ course_name: 'Cálculo Diferencial' }],
  })
}

function switchRole(role: 'Director de Departamento' | 'Docente') {
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Cambiar de rol').click()
  cy.get('[data-slot="dropdown-menu-radio-item"]').contains(role).click()
  cy.location('pathname').should('eq', '/home')
}

describe('Ciclo de evidencias', () => {
  let createdPlanIds: number[] = []

  before(() => {
    ownTeacherId().then((id) => (teacherId = id))
    seedPeriod(`Periodo Evidencias ${marca}`).then((id) => (periodId = id))

    // Un solo login real por UI para todo el spec, no uno por test: Firebase
    // limita cuántos `signInWithPassword` acepta por proyecto en una ventana
    // de tiempo (ver E2E.md "Problemas conocidos"), y con 3 tests en este
    // archivo repetirlo en cada `beforeEach` era 3 logins reales de sobra.
    // La sesión que deja este login vive en la IndexedDB de Firebase, que
    // Cypress no limpia entre pruebas (solo cookies/localStorage), así que
    // sigue ahí para el resto del spec — ver `beforeEach`.
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  after(() => {
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

  it('la entrega pasa la solicitud a EN_REVISION, y aprobarla la deja en APROBADA', () => {
    seedPlan(`Plan evidencias aprobar ${marca}`).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('h2', 'Evidencias', { timeout: 20000 }).should('be.visible')

      cy.contains('button', 'Solicitar evidencia').click()
      cy.get('#req-title').type('Listas de asistencia semanas 1-8')
      cy.contains('[role="dialog"] button', 'Solicitar').click()

      cy.contains('li', 'Listas de asistencia semanas 1-8', { timeout: 20000 })
        .should('contain.text', 'Pendiente de entrega')

      switchRole('Docente')

      cy.visit(`/mis-planes/${planId}`)
      cy.contains('Listas de asistencia semanas 1-8', { timeout: 20000 }).should('be.visible')

      cy.contains('li', 'Listas de asistencia semanas 1-8')
        .contains('button', 'Adjuntar')
        .click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf('listas.pdf'), {
        force: true,
      })
      cy.contains('[role="dialog"] button', 'Adjuntar').click()

      // RF-6.12: la entrega pasa la solicitud a EN_REVISION de verdad.
      cy.contains('li', 'Listas de asistencia semanas 1-8', { timeout: 20000 }).should(
        'contain.text',
        'En revisión',
      )

      switchRole('Director de Departamento')
      cy.visit(`/planes/${planId}`)
      cy.contains('listas.pdf', { timeout: 20000 }).should('be.visible')

      cy.contains('li', 'listas.pdf').contains('button', 'Aprobar').click()

      cy.contains('li', 'listas.pdf', { timeout: 20000 }).should('contain.text', 'Aprobada')
      cy.contains('li', 'Listas de asistencia semanas 1-8').should('contain.text', 'Aprobada')
    })
  })

  it('rechazar una entrega la regresa a PENDIENTE con un comentario de sistema', () => {
    seedPlan(`Plan evidencias rechazar ${marca}`).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('h2', 'Evidencias', { timeout: 20000 }).should('be.visible')

      cy.contains('button', 'Solicitar evidencia').click()
      cy.get('#req-title').type('Formato de seguimiento firmado')
      cy.contains('[role="dialog"] button', 'Solicitar').click()

      switchRole('Docente')
      cy.visit(`/mis-planes/${planId}`)
      cy.contains('Formato de seguimiento firmado', { timeout: 20000 }).should('be.visible')

      cy.contains('li', 'Formato de seguimiento firmado')
        .contains('button', 'Adjuntar')
        .click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf('seguimiento.pdf'), {
        force: true,
      })
      cy.contains('[role="dialog"] button', 'Adjuntar').click()

      switchRole('Director de Departamento')
      cy.visit(`/planes/${planId}`)
      cy.contains('seguimiento.pdf', { timeout: 20000 }).should('be.visible')

      cy.get('input[placeholder="Escribe un comentario…"]').first().type('Falta la firma del docente')
      cy.contains('li', 'seguimiento.pdf').contains('button', 'Rechazar').click()

      // RF-6.12: vuelve a PENDIENTE y queda un comentario de sistema, no solo
      // el que escribió la directora al rechazar.
      cy.contains('li', 'Formato de seguimiento firmado', { timeout: 20000 }).should(
        'contain.text',
        'Pendiente de entrega',
      )
      cy.contains('li', 'seguimiento.pdf').should('contain.text', 'Rechazada')
      cy.contains('Falta la firma del docente').should('be.visible')
      cy.contains('Sistema:').should('be.visible')
      cy.contains('La evidencia fue rechazada. Se requiere una nueva entrega.').should(
        'be.visible',
      )
    })
  })

  it('el hilo de comentarios se ve igual desde los dos lados del plan', () => {
    seedPlan(`Plan evidencias comentarios ${marca}`).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('button', 'Solicitar evidencia').click()
      cy.get('#req-title').type('Rúbrica de evaluación')
      cy.contains('[role="dialog"] button', 'Solicitar').click()

      cy.contains('li', 'Rúbrica de evaluación', { timeout: 20000 })
        .find('input[placeholder="Escribe un comentario…"]')
        .type(`Quedo atenta ${marca}{enter}`)

      cy.contains(`Quedo atenta ${marca}`, { timeout: 20000 }).should('be.visible')

      switchRole('Docente')
      cy.visit(`/mis-planes/${planId}`)

      cy.contains(`Quedo atenta ${marca}`, { timeout: 20000 }).should('be.visible')
    })
  })
})
