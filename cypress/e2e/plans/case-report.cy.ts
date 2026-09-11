/**
 * RF-6.7 (Alta) — Formato 1 con el caso reportado por un programa académico.
 *
 * Corre contra la pila real. La interfaz solo ofrece adjuntar el PDF del caso
 * (ya firmado, remitido por el programa académico) — no hay formulario para
 * campos estructurados (queja, observaciones, referencia del acta del
 * comité), aunque el backend tenga un endpoint para eso
 * (`PUT .../case-report`). Eso quedó reportado aparte como un hueco de
 * producto, no de pruebas — aquí se prueba el flujo real que sí existe: subir
 * y quitar el PDF adjunto.
 *
 * El backend no valida el contenido del PDF, solo que el nombre termine en
 * `.pdf` y no esté vacío — así que un archivo mínimo generado en memoria basta,
 * sin necesitar un PDF real de fixture.
 */

import { directorDepartmentId, ownTeacherId, seedPeriod, seedTeacher } from '../../support/planFixtures'

const marca = `${Date.now()}`

let otherTeacherId: number
let selfTeacherId: number
let periodId: number

function fakePdf(name = 'caso-reportado.pdf') {
  return {
    contents: Cypress.Buffer.from('%PDF-1.4 contenido de prueba'),
    fileName: name,
    mimeType: 'application/pdf',
  }
}

function seedPlan(teacherId: number, title: string) {
  return cy.api('POST', '/improvement-plans/', {
    teacher_id: teacherId,
    origin_period_id: periodId,
    title,
    items: [{ description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 }],
    courses: [{ course_name: 'Cálculo Diferencial' }],
  })
}

describe('Formato 1 — caso reportado', () => {
  let createdPlanIds: number[] = []

  before(() => {
    directorDepartmentId().then((departmentId) => {
      seedTeacher(`Docente Formato1 ${marca}`, departmentId).then((id) => (otherTeacherId = id))
    })
    ownTeacherId().then((id) => (selfTeacherId = id))
    seedPeriod(`Periodo Formato1 ${marca}`).then((id) => (periodId = id))
  })

  after(() => {
    cy.api('DELETE', `/teachers/${otherTeacherId}`)
    cy.api('DELETE', `/academic-periods/${periodId}`)
  })

  beforeEach(() => {
    createdPlanIds = []
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  afterEach(() => {
    for (const id of createdPlanIds) {
      cy.api('DELETE', `/improvement-plans/${id}`)
    }
  })

  it('adjunta el PDF del caso reportado y luego lo quita', () => {
    seedPlan(otherTeacherId, `Plan Formato 1 ${marca}`).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Formato 1 · Caso reportado', { timeout: 20000 }).should('be.visible')

      cy.contains('li', 'Formato 1 · Caso reportado').within(() => {
        cy.contains('button', 'Adjuntar Formato 1').should('be.visible')
        cy.contains('button', /^Descargar/).should('not.exist')
      })

      cy.contains('button', 'Adjuntar Formato 1').click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf(), { force: true })
      cy.contains('[role="dialog"] button', 'Subir').click()

      cy.contains('li', 'Formato 1 · Caso reportado', { timeout: 20000 }).within(() => {
        cy.contains(/Adjuntado el/).should('be.visible')
        cy.contains('button', 'Adjuntar Formato 1').should('not.exist')
      })

      // Y se puede quitar de nuevo.
      cy.contains('li', 'Formato 1 · Caso reportado')
        .find('button[title="Eliminar el PDF adjunto"]')
        .click()

      // Se escoge el diálogo por su propio texto, no solo por rol o slot: el
      // plan también tiene un diálogo de "¿Eliminar el plan de
      // mejoramiento?" con la misma forma, y un clic sin este alcance
      // corría el riesgo de caer en el equivocado.
      cy.contains('[data-slot="alert-dialog-content"]', '¿Eliminar el PDF adjunto?', {
        timeout: 20000,
      }).within(() => {
        // El overlay de la alerta a veces sigue en transición cuando este
        // clic llega — mismo motivo del `force` ya usado en otros
        // popovers del proyecto.
        cy.contains('button', 'Eliminar').click({ force: true })
      })

      cy.contains('li', 'Formato 1 · Caso reportado', { timeout: 20000 }).within(() => {
        cy.contains('button', 'Adjuntar Formato 1').should('be.visible')
        cy.contains(/Adjuntado el/).should('not.exist')
      })
    })
  })

  it('al docente nunca se le muestra el Formato 1', () => {
    // El Formato 1 lo diligencia y guarda la dirección del departamento — al
    // docente del plan (aquí, la propia cuenta de pruebas operando como
    // DOCENTE) nunca se le ofrece ni se le muestra.
    // El título deliberadamente no contiene "Formato 1": la aserción de
    // abajo busca ese texto en la página, y el propio título del plan lo
    // habría hecho encontrarlo sin que viniera de la interfaz.
    seedPlan(selfTeacherId, `Plan propio de prueba ${marca}`).then((response) => {
      const ownPlanId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(ownPlanId)

      // La vista del docente solo lista un formato una vez tiene algo que
      // mostrar (generado o firmado) — se genera el Formato 2 para que la
      // sección de Documentos no se quede vacía.
      cy.api('POST', `/improvement-plans/${ownPlanId}/documents/formato-2/generate`)

      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Cambiar de rol').click()
      cy.get('[data-slot="dropdown-menu-radio-item"]').contains('Docente').click()
      cy.location('pathname').should('eq', '/home')

      cy.visit(`/mis-planes/${ownPlanId}`)
      cy.contains('Formato 2 · Ficha de acuerdo', { timeout: 20000 }).should('be.visible')
      cy.contains('Formato 1').should('not.exist')
    })
  })
})
