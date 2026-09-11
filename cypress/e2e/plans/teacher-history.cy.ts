/**
 * RF-6.5 (Media) — Consulta de los cursos y del historial de planes de un
 * docente.
 *
 * Corre contra la pila real, departamento "Sistemas". La consulta de cursos ya
 * queda probada de fondo en `creation.cy.ts` (paso 4 del asistente, que trae
 * las asignaturas reales del docente) — este spec se enfoca en el historial de
 * planes, que vive en la ficha del docente (`/docentes/:id`) a través de
 * `TeacherPlanAction` y en el listado filtrado (`/planes?docente=...`).
 *
 * Docentes reales usados:
 *   - PEREZ PEREZ HC (id 14): se le siembran dos planes reales, en 2025-1 y
 *     2026-1, para probar el historial cruzando periodos.
 *   - MAURICIO DI DONATO SANCHEZ (id 12): se le siembra un plan solo en
 *     2025-1, para ver la ficha de un periodo sin plan propio pero con
 *     historial en otros.
 *   - JULIAN ALFONSO RODRIGUEZ CASTRO TP (id 13): sin ningún plan, para
 *     confirmar que sin historial no se ofrece "Ver historial".
 */

const marca = `${Date.now()}`

function seedPlan(teacherId: number, periodId: number, title: string) {
  return cy.api('POST', '/improvement-plans/', {
    teacher_id: teacherId,
    origin_period_id: periodId,
    title,
    acta_number: '099',
    acta_date: '2026-01-15',
    items: [{ description: 'Asistir puntualmente a clase', commitment: 'Llegar a tiempo', aspect: 2 }],
    courses: [{ course_name: 'Cálculo Diferencial' }],
  })
}

describe('Cursos e historial de planes de un docente', () => {
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

  it('muestra el historial cruzando periodos, con los dos planes reales del docente', () => {
    const title2025 = `Historial 2025-1 ${marca}`
    const title2026 = `Historial 2026-1 ${marca}`

    seedPlan(14, 1, title2025).then((r) =>
      createdPlanIds.push((r.body as { data: { id: number } }).data.id),
    )
    seedPlan(14, 2, title2026).then((r) =>
      createdPlanIds.push((r.body as { data: { id: number } }).data.id),
    )

    cy.visit('/docentes/14?period=2026-1')
    cy.contains('PEREZ PEREZ HC', { timeout: 20000 }).should('be.visible')

    cy.contains('Plan de mejoramiento').parent().should('contain.text', title2026)
    cy.contains('button', 'Ver plan').should('be.visible')

    cy.contains('button', 'Ver historial').click()

    cy.location('pathname', { timeout: 20000 }).should('eq', '/planes')
    cy.location('search').should('include', 'periodo=todos')
    cy.contains(title2025, { timeout: 20000 }).should('be.visible')
    cy.contains(title2026).should('be.visible')
  })

  it('sin plan en el periodo mostrado pero con historial en otros, ofrece crear uno y ver el historial', () => {
    const title2025 = `Sin plan aquí ${marca}`

    seedPlan(12, 1, title2025).then((r) =>
      createdPlanIds.push((r.body as { data: { id: number } }).data.id),
    )

    cy.visit('/docentes/12?period=2026-1')
    cy.contains('MAURICIO DI DONATO SANCHEZ', { timeout: 20000 }).should('be.visible')

    cy.contains('Sin plan en el periodo 2026-1').should('be.visible')
    cy.contains('1 plan en otros periodos').should('be.visible')

    cy.contains('button', 'Crear plan de mejoramiento').should('be.visible')
    cy.contains('button', 'Ver historial').click()

    cy.location('pathname', { timeout: 20000 }).should('eq', '/planes')
    cy.contains(title2025, { timeout: 20000 }).should('be.visible')
  })

  it('sin ningún plan, no ofrece ver un historial que no existe', () => {
    cy.visit('/docentes/13?period=2026-1')
    cy.contains('JULIAN ALFONSO RODRIGUEZ CASTRO', { timeout: 20000 }).should('be.visible')

    cy.contains('Este docente no tiene un plan de seguimiento registrado.').should('be.visible')
    cy.contains('button', 'Ver historial').should('not.exist')
    cy.contains('button', 'Crear plan de mejoramiento').should('be.visible')
  })
})
