/**
 * RF-6.4 (Alta) — Transiciones válidas e inválidas entre los cinco estados
 * del plan y cierre con motivo.
 * RF-6.13 (Alta) — Verificación automática del plan con los resultados del
 * periodo siguiente sobre indicadores numéricos y sobre comentarios.
 *
 * Corre contra la pila real. Los dos seguimientos se siembran por API (ya
 * probados por interfaz en `checkpoints.cy.ts`) para llegar rápido a la
 * precondición real del cierre — Formato 3 firmado — y centrar este spec en
 * el propio cierre.
 *
 * La verificación automática se dispara cuando se procesa una evaluación
 * real del periodo de verificación — el mismo pipeline de PDFs usado en
 * RF-5, que no se repite aquí. Lo que sí se prueba de verdad es el estado
 * inmediato y honesto de un plan recién cerrado, antes de que esas notas
 * existan: "aún no llegaron las notas", no una verificación inventada.
 */

const marca = `${Date.now()}`

function fakePdf(name: string) {
  return {
    contents: Cypress.Buffer.from('%PDF-1.4 contenido de prueba'),
    fileName: name,
    mimeType: 'application/pdf',
  }
}

describe('Cierre del plan y verificación automática', () => {
  let createdPlanIds: number[] = []

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

  it('no deja cerrar el plan hasta que el Formato 3 está firmado, y cierra con motivo una vez lo está', () => {
    cy.api('POST', '/improvement-plans/', {
      teacher_id: 1,
      origin_period_id: 1,
      title: `Plan cierre ${marca}`,
      items: [
        { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
      ],
      courses: [{ course_name: 'Cálculo Diferencial' }],
    }).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      // Los dos seguimientos, sembrados por API.
      cy.api('GET', `/improvement-plans/${planId}`).then((planResponse) => {
        const plan = (planResponse.body as { data: { checkpoints: { id: number; stage: string }[] } })
          .data
        for (const checkpoint of plan.checkpoints) {
          cy.api('PUT', `/improvement-plans/${planId}/checkpoints/${checkpoint.id}`, {
            scheduled_date: '2026-05-04',
            aspect_notes: [{ aspect: 2, note: 'Mejoró notablemente' }],
          })
        }
      })

      cy.visit(`/planes/${planId}`)
      cy.contains('Formato 3 · Plan de seguimiento', { timeout: 20000 }).should('be.visible')

      // RF-6.4: sin el Formato 3 firmado, cerrar no es una transición válida.
      cy.contains('button', 'Cerrar plan').should('be.disabled')
      cy.contains('Falta el Formato 3 firmado').should('be.visible')

      cy.contains('li', 'Formato 3 · Plan de seguimiento')
        .contains('button', 'Subir firmado')
        .click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf('formato3-firmado.pdf'), {
        force: true,
      })
      cy.contains('[role="dialog"] button', 'Subir').click()

      cy.contains('Formato 3 firmado', { timeout: 20000 }).should('be.visible')
      cy.contains('button', 'Cerrar plan').should('be.enabled').click()

      cy.get('[role="dialog"]').within(() => {
        cy.contains('label', /^Cumplido/).click()
        cy.get('textarea').type('El docente corrigió lo acordado')
        cy.contains('button', 'Cerrar plan').click()
      })

      // El cierre real, con motivo, deja de ofrecer cerrar otra vez — es una
      // transición de sentido único.
      cy.contains('Cerrado · cumplido', { timeout: 20000 }).should('be.visible')
      cy.contains('El docente corrigió lo acordado').should('be.visible')
      cy.contains('button', 'Cerrar plan').should('not.exist')
    })
  })

  it('un plan recién cerrado dice honestamente que las notas de verificación aún no llegan', () => {
    cy.api('POST', '/improvement-plans/', {
      teacher_id: 1,
      origin_period_id: 1,
      title: `Plan verificación pendiente ${marca}`,
      items: [
        { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
      ],
      courses: [{ course_name: 'Cálculo Diferencial' }],
    }).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.api('GET', `/improvement-plans/${planId}`).then((planResponse) => {
        const plan = (planResponse.body as { data: { checkpoints: { id: number }[] } }).data
        for (const checkpoint of plan.checkpoints) {
          cy.api('PUT', `/improvement-plans/${planId}/checkpoints/${checkpoint.id}`, {
            scheduled_date: '2026-05-04',
            aspect_notes: [{ aspect: 2, note: 'Mejoró notablemente' }],
          })
        }
      })
      cy.api('POST', `/improvement-plans/${planId}/documents/formato-3/generate`)

      cy.visit(`/planes/${planId}`)
      cy.contains('button', 'Cerrar plan', { timeout: 20000 }).should('be.disabled')

      cy.contains('li', 'Formato 3 · Plan de seguimiento')
        .contains('button', 'Subir firmado')
        .click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf('formato3-firmado.pdf'), {
        force: true,
      })
      cy.contains('[role="dialog"] button', 'Subir').click()

      cy.contains('button', 'Cerrar plan', { timeout: 20000 }).should('be.enabled').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('label', /^No cumplido/).click()
        cy.contains('button', 'Cerrar plan').click()
      })

      cy.contains('h2', 'Verificación del semestre siguiente', { timeout: 20000 }).should(
        'be.visible',
      )
      cy.contains('Aún no se han cargado las notas de').should('be.visible')
      cy.contains('La verificación se hace sola en cuanto se suban.').should('be.visible')
    })
  })
})
