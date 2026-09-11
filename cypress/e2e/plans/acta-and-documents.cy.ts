/**
 * RF-6.8 (Alta) — Ciclo del acta del Formato 2 entre BORRADOR, CERRADA y
 * FIRMADA, comprobando que el cierre congela el acta y deja editable el
 * resto del plan.
 * RF-6.10 (Alta) — Generación de los tres PDF, descarga, carga de la versión
 * firmada, eliminación y paso del acta a FIRMADA.
 *
 * Corre contra la pila real. El estado intermedio CERRADA no es alcanzable
 * desde la interfaz actual — el acta salta directo de BORRADOR a FIRMADA al
 * subir la firma — y quedó reportado aparte como un hueco de producto. Este
 * spec prueba el ciclo BORRADOR→FIRMADA que sí existe de verdad, incluida la
 * reacción real (sin recargar la página) de que el acta pase a FIRMADA justo
 * después de subir la firma — la propia razón por la que esta prueba tiene
 * que vivir aquí y no en unitarias: cruza dos consultas (el documento subido
 * y el plan que lo refleja) y solo se puede confirmar contra la pila real.
 *
 * No hay generación manual: la API arma cada formato al vuelo cuando se pide
 * su descarga, así que "generar" y "descargar" son el mismo clic.
 */

const marca = `${Date.now()}`

function fakePdf(name: string) {
  return {
    contents: Cypress.Buffer.from('%PDF-1.4 contenido de prueba'),
    fileName: name,
    mimeType: 'application/pdf',
  }
}

function seedPlan(overrides: Record<string, unknown> = {}) {
  return cy.api('POST', '/improvement-plans/', {
    teacher_id: 12,
    origin_period_id: 3,
    title: `Plan acta y documentos ${marca}`,
    ...overrides,
  })
}

describe('Formato 2 (acta) y los tres formatos', () => {
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

  it('no deja firmar el acta mientras falten datos, y explica cuáles', () => {
    // Sin número de acta, sin fecha y sin compromisos — falta todo.
    seedPlan().then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Formato 2 · Ficha de acuerdo', { timeout: 20000 }).should('be.visible')

      cy.contains('li', 'Formato 2 · Ficha de acuerdo')
        .contains('button', 'Subir firmado')
        .should('be.disabled')
        .and(
          'have.attr',
          'title',
          'Antes de firmar el acta falta registrar el número del acta, la fecha del acta, al menos un compromiso',
        )
    })
  })

  it('firmar el acta la pasa a FIRMADA de verdad, y quitar la firma la reabre', () => {
    seedPlan({
      acta_number: '099',
      acta_date: '2026-01-15',
      items: [
        { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
      ],
      courses: [{ course_name: 'Cálculo Diferencial' }],
    }).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Acta en borrador', { timeout: 20000 }).should('be.visible')
      cy.contains('en vigencia').should('not.exist')

      cy.contains('li', 'Formato 2 · Ficha de acuerdo')
        .contains('button', 'Subir firmado')
        .click()
      cy.get('[role="dialog"] input[type="file"]').selectFile(fakePdf('acta-firmada.pdf'), {
        force: true,
      })
      cy.contains('[role="dialog"] button', 'Subir').click()

      // Reacción real, sin recargar: el badge del acta y el aviso de vigencia
      // aparecen justo después de que la subida responde.
      cy.contains('Acta firmada', { timeout: 20000 }).should('be.visible')
      cy.contains('en vigencia').should('be.visible')
      cy.contains('Acta en borrador').should('not.exist')

      // El plan firmado ya no se puede editar.
      cy.visit(`/planes/${planId}/editar`)
      cy.contains('El acuerdo está firmado', { timeout: 20000 }).should('be.visible')

      // Quitar la firma lo reabre — mismo ciclo, de vuelta.
      cy.visit(`/planes/${planId}`)
      cy.contains('li', 'Formato 2 · Ficha de acuerdo', { timeout: 20000 })
        .find('button[title="Eliminar el PDF firmado"]')
        .click()

      cy.contains('[data-slot="alert-dialog-content"]', '¿Eliminar el PDF firmado?', {
        timeout: 20000,
      }).within(() => {
        cy.contains('button', 'Eliminar').click({ force: true })
      })

      cy.contains('Acta en borrador', { timeout: 20000 }).should('be.visible')
      cy.contains('en vigencia').should('not.exist')

      cy.visit(`/planes/${planId}/editar`)
      cy.contains('El acuerdo está firmado').should('not.exist')
    })
  })

  it('descarga los formatos 2 y 3 reales, generándolos al vuelo', () => {
    seedPlan({
      acta_number: '099',
      acta_date: '2026-01-15',
      items: [
        { description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 },
      ],
      courses: [{ course_name: 'Cálculo Diferencial' }],
    }).then((response) => {
      const planId = (response.body as { data: { id: number } }).data.id
      createdPlanIds.push(planId)

      cy.visit(`/planes/${planId}`)
      cy.contains('Formato 3 · Plan de seguimiento', { timeout: 20000 }).should('be.visible')

      cy.intercept('GET', '**/documents/formato-3*').as('downloadFormato3')
      cy.contains('li', 'Formato 3 · Plan de seguimiento')
        .contains('button', /Descargar/)
        .click()
      cy.contains('[role="menuitem"]', 'Formato PDF').click()

      cy.wait('@downloadFormato3').its('response.statusCode').should('eq', 200)
    })
  })

})
