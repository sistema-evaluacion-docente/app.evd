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

import { directorDepartmentId, seedPeriod, seedTeacher } from '../../support/planFixtures'

const marca = `${Date.now()}`

function fakePdf(name: string) {
  return {
    contents: Cypress.Buffer.from('%PDF-1.4 contenido de prueba'),
    fileName: name,
    mimeType: 'application/pdf',
  }
}

// Año sintético, lejos de cualquier periodo real, para no chocar con datos
// sembrados a mano — pero con el formato "AAAA-N" que
// `ImprovementPlansRepository._next_period_code` exige para derivar el
// periodo de verificación (el siguiente semestre) al crear el plan.
const syntheticYear = 9000 + (Date.now() % 900)
const originCode = `${syntheticYear}-1`
const verificationCode = `${syntheticYear}-2`

describe('Cierre del plan y verificación automática', () => {
  let createdPlanIds: number[] = []
  let teacherId: number
  let periodId: number
  let verificationPeriodId: number

  before(() => {
    directorDepartmentId().then((departmentId) => {
      seedTeacher(`Docente Cierre ${marca}`, departmentId).then((id) => (teacherId = id))
    })
    seedPeriod(originCode).then((id) => (periodId = id))
    // Sin este periodo, `origin_period_id` no encuentra a quién asignar la
    // verificación automática (RF-6.13) y el plan queda sin
    // `verification_period_id` — la segunda prueba de este archivo depende
    // de que exista, aunque no tenga ninguna evaluación cargada todavía.
    seedPeriod(verificationCode).then((id) => (verificationPeriodId = id))

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
    cy.api('DELETE', `/teachers/${teacherId}`)
    cy.api('DELETE', `/academic-periods/${periodId}`)
    cy.api('DELETE', `/academic-periods/${verificationPeriodId}`)
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

  it('no deja cerrar el plan hasta que el Formato 3 está firmado, y cierra con motivo una vez lo está', () => {
    cy.api('POST', '/improvement-plans/', {
      teacher_id: teacherId,
      origin_period_id: periodId,
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
      teacher_id: teacherId,
      origin_period_id: periodId,
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
