/**
 * RF-7.2 (Media) — Envío de correos institucionales asociados a los eventos
 * del plan de mejoramiento.
 *
 * El envío real de correo no es observable desde aquí: el backend local corre
 * con `MAIL_BACKEND=console` (sin credenciales SMTP), así que un correo
 * "enviado" solo queda en el log del contenedor. Pero cada evento que dispara
 * un correo (creación del plan, solicitud de evidencia, cierre) dispara en el
 * mismo método del backend una notificación real en la plataforma — la prueba
 * observable y honesta de que el flujo de correo se ejecutó es esa
 * notificación, sembrada por el propio backend, no por este spec.
 *
 * El plan de base se crea por API (preparar datos, no lo que se prueba —
 * mismo criterio que el resto de specs): armar uno a mano por la interfaz es
 * un asistente de 5 pasos (periodo y docente, elegir indicadores y redactar
 * un compromiso completo en su propio diálogo, asignaturas, datos del acta),
 * que pertenece a las pruebas de gestión de planes, no a esta de correos.
 * "Solicitar evidencia" sí es un evento limpio, sin ese asistente, así que se
 * prueba de verdad por la interfaz.
 *
 * La cuenta de pruebas (System Admin, `teacher_id` 1, departamento Sistemas)
 * hace de docente del plan además de directora — el propio backend está
 * pensado para eso ("a single account can hold both roles... which is exactly
 * the case the flow has to be testable on"), así que la notificación del
 * docente cae en la bandeja de la misma cuenta con la que se prueba.
 */

import { ownTeacherId, seedPeriod } from '../../support/planFixtures'

let teacherId: number
let periodId: number
let planId: number

before(() => {
  // `teacher_id` (la fila de la tabla `teachers`), no `id` (la de `users`)
  // — el plan se crea contra la primera, y para esta cuenta ambas
  // coinciden en el mismo número por casualidad.
  ownTeacherId().then((id) => (teacherId = id))
  seedPeriod(`Periodo Correos ${Date.now()}`).then((id) => (periodId = id))
})

after(() => {
  cy.api('DELETE', `/academic-periods/${periodId}`)
})

beforeEach(() => {
  cy.watchApi()
  cy.api('PUT', '/notifications/me/read-all')

  cy.api('POST', '/improvement-plans/', {
    teacher_id: teacherId,
    origin_period_id: periodId,
    title: `Plan de prueba Cypress ${Date.now()}`,
  }).then((response) => {
    planId = (response.body as { data: { id: number } }).data.id
  })

  cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
  cy.loginWithEmail()
  cy.location('pathname').should('eq', '/home')
})

afterEach(() => {
  if (planId) cy.api('DELETE', `/improvement-plans/${planId}`)
})

describe('Correos institucionales de los eventos del plan de mejoramiento', () => {
  it('crear el plan notifica al docente — la misma vía por la que sale el correo', () => {
    // El plan ya se creó por API en el `beforeEach`: se confirma aquí la
    // notificación real que ese mismo evento dejó, sin repetir la creación
    // por interfaz (ver la nota del encabezado).
    cy.api('GET', '/notifications/me?page=1&limit=10').then((response) => {
      const items = (response.body as { data: Array<{ title: string; read: boolean }> }).data
      const notice = items.find((item) => item.title === 'Nuevo plan de mejoramiento')

      expect(notice?.title, 'notificación de nuevo plan').to.eq('Nuevo plan de mejoramiento')
      expect(notice?.read).to.eq(false)
    })
  })

  it('solicitar evidencia, por la interfaz real, notifica al docente', () => {
    cy.visit(`/planes/${planId}`)
    cy.contains('h2', 'Evidencias', { timeout: 20000 }).should('be.visible')

    cy.contains('button', 'Solicitar evidencia').click()

    cy.get('[role="dialog"]').should('contain.text', 'un correo con el entregable solicitado')

    cy.get('#req-title').type('Listas de asistencia Cypress')
    cy.contains('[role="dialog"] button', 'Solicitar').click()

    // El diálogo se cierra solo cuando la API confirma la solicitud creada.
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('Listas de asistencia Cypress').should('be.visible')

    cy.api('GET', '/notifications/me?page=1&limit=10').then((response) => {
      const items = (response.body as { data: Array<{ title: string; message: string }> }).data
      const notice = items.find((item) => item.title === 'Nueva evidencia solicitada')

      expect(notice?.title, 'notificación de evidencia solicitada').to.eq(
        'Nueva evidencia solicitada',
      )
      expect(notice?.message).to.include('Listas de asistencia Cypress')
    })
  })
})
