/**
 * RF-5.3 (Alta) — Historial del docente con su promedio frente al periodo
 * anterior, su comparación con el departamento y su comparación consigo
 * mismo.
 * RF-5.4 (Alta) — Promedios por dimensión del docente y matriz de
 * resultados.
 * RF-5.5 (Media) — Cursos del docente por periodo y agrupación de sus
 * comentarios por materia.
 * RF-5.8 (Media) — Comparación del desempeño de un docente entre dos
 * periodos académicos.
 * RF-5.9 (Media) — Descarga del reporte de evaluación del docente.
 *
 * Corre contra la pila real, departamento `99` fijo (ver
 * `evaluationFixtures.ts`) — dos periodos reales, `2025-2` y `2026-1`, así
 * que el contraste y la tendencia entre periodos son datos de verdad.
 *
 * Docente examinado: DOCENTE 1. La propia cuenta del director desechable de
 * este spec se enlaza a su fila de docente (`PUT /teachers/{id}`) y suma el
 * rol DOCENTE — el mismo patrón que ya usa la cuenta compartida de pruebas
 * ("System Admin") para operar como director y como docente a la vez — así
 * RF-5.4 puede cambiar de rol y ver su propia matriz con datos reales, sin
 * necesitar una segunda cuenta.
 *
 * Las cifras no se hardcodean: se leen de la propia API dentro de cada
 * prueba y se comparan contra lo que muestra la interfaz.
 */

import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

function fmt(value: number): string {
  return value.toFixed(2)
}

interface DimensionDetail {
  dimension: string
  average: number
  questions: Array<{ code: string; text: string; average: number }>
}

interface DimensionsDetailResponse {
  dimensions: DimensionDetail[]
}

/** Cambia al rol DOCENTE desde el menú del avatar — mismo flujo real que `auth/roles.cy.ts`. */
function switchToDocenteRole() {
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Cambiar de rol').click()
  cy.get('[data-slot="dropdown-menu-radio-item"]').contains('Docente').click()
  cy.location('pathname').should('eq', '/home')
}

let fixtureDepartment: { id: number }
let director: DirectorAccount
let teacherIds: { docente1: number; docente2: number; docente3: number }
let eval2026Id: number
/** El nombre visible de DOCENTE 1 pasa a ser el del director una vez
 * enlazados (`teacher.user.name` sigue al usuario vinculado) — se lee de la
 * API en vez de asumir el formato exacto que arma `createDirectorAccount`. */
let docente1Name: string

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('detalle').then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
      seedFixtureEvaluations(account).then((seeded) => {
        teacherIds = seeded.teacherIds
        eval2026Id = seeded.eval2026.id

        // DOCENTE 1 es la propia cuenta del director, para poder cambiar a
        // Docente y ver su matriz con datos reales (RF-5.4).
        cy.api('PUT', `/teachers/${teacherIds.docente1}`, { user_id: account.id })
        cy.api('PUT', `/users/${account.uid}/roles`, {
          roles: ['DIRECTOR DE DEPARTAMENTO', 'DOCENTE'],
        })

        cy.apiAs(account.email, account.password, 'GET', '/users/auth').then((response) => {
          docente1Name = (response.body as { data: { name: string } }).data.name
        })
      })
    })
  })
})

after(() => {
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

describe('Detalle del docente', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')
  })

  describe('RF-5.3 — Historial y comparaciones', () => {
    beforeEach(() => {
      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains(docente1Name, { timeout: 20000 }).should('be.visible')
    })

    it('muestra el promedio frente al periodo anterior', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/evaluations/teachers/${teacherIds.docente1}/detail?period_name=2026-1&compare_previous=true`,
      ).then((response) => {
        const detail = (
          response.body as {
            data: { overall_average: number; previous_period: { overall_average: number } | null }
          }
        ).data
        const delta = Number(
          (detail.overall_average - detail.previous_period!.overall_average).toFixed(2),
        )
        const trend = delta >= 0 ? 'aumentó' : 'disminuyó'

        cy.contains('Promedio general del periodo')
          .parent()
          .find('[aria-label*="periodo anterior"]')
          .should('have.attr', 'aria-label')
          .and('include', trend)
          .and('include', Math.abs(delta).toFixed(2))
      })
    })

    it('compara al docente consigo mismo a lo largo del tiempo', () => {
      cy.contains('h2', 'Evolución del promedio por periodo').scrollIntoView()
      cy.contains('2025-2').should('be.visible')
      cy.contains('2026-1').should('be.visible')
    })

    it('compara al docente con el promedio del departamento', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/evaluations/${eval2026Id}/dimensions/detail`,
      ).then((overallResponse) => {
        const overall = (overallResponse.body as { data: DimensionsDetailResponse }).data.dimensions
        const overallDim = overall.find((d) => d.dimension === 'Desarrollo del Conocimiento')!

        cy.apiAs(
          director.email,
          director.password,
          'GET',
          `/evaluations/${eval2026Id}/dimensions/detail?teacher_id=${teacherIds.docente1}`,
        ).then((filteredResponse) => {
          const filtered = (filteredResponse.body as { data: DimensionsDetailResponse }).data
            .dimensions
          const filteredDim = filtered.find((d) => d.dimension === 'Desarrollo del Conocimiento')!

          const delta = Number((filteredDim.average - overallDim.average).toFixed(2))
          const trend = delta >= 0 ? 'aumentó' : 'disminuyó'

          cy.visit(`/evaluaciones/${eval2026Id}/dimensiones`)
          cy.contains('h2', 'Desglose por dimensión pedagógica', { timeout: 20000 }).should(
            'be.visible',
          )

          cy.contains('button', 'Filtros').click()
          cy.get('[aria-label="Docente"]').click().type(docente1Name.split(' ')[0])
          cy.contains('[data-slot="combobox-item"]:visible', docente1Name).click()

          cy.contains('Desarrollo del Conocimiento')
            .closest('[data-slot="collapsible-trigger"]')
            .find('[aria-label*="promedio del departamento"]')
            .should('have.attr', 'aria-label')
            .and('include', trend)
            .and('include', Math.abs(delta).toFixed(2))
        })
      })
    })
  })

  describe('RF-5.4 — Dimensiones y matriz de resultados', () => {
    beforeEach(() => {
      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains(docente1Name, { timeout: 20000 }).should('be.visible')
    })

    it('muestra el promedio de las cuatro dimensiones pedagógicas', () => {
      cy.apiAs(
        director.email,
        director.password,
        'GET',
        `/evaluations/${eval2026Id}/dimensions/detail?teacher_id=${teacherIds.docente1}`,
      ).then((response) => {
        const dimensions = (response.body as { data: DimensionsDetailResponse }).data.dimensions
        const conocimiento = dimensions.find((d) => d.dimension === 'Desarrollo del Conocimiento')!

        cy.contains('Desarrollo del Conocimiento').should('be.visible')
        cy.contains('Desempeño Docente').should('be.visible')
        cy.contains('Procesos de Evaluación').should('be.visible')
        cy.contains('Integración Interpersonal').should('be.visible')

        cy.contains('Desarrollo del Conocimiento')
          .parent()
          .should('contain.text', fmt(conocimiento.average))
      })
    })

    it('despliega la matriz de resultados por pregunta y por materia', () => {
      // La matriz por pregunta vive en el panel propio del docente — cambiar
      // de rol lleva a la cuenta al propio `/home` como DOCENTE 1.
      switchToDocenteRole()

      cy.contains('button', /Ver preguntas/, { timeout: 20000 })
        .scrollIntoView()
        .click({ force: true })

      // Una pregunta real del instrumento, con su código.
      cy.contains('Da a conocer la programación al inicio del semestre.').should('be.visible')

      // DOCENTE 1 dicta varias materias ese periodo — la matriz trae al
      // menos dos de sus columnas reales.
      cy.contains('th', 'ESTRUCTURAS DE DATOS').should('be.visible')
      cy.contains('th', 'FUNDAMENTOS DE PROGRAMACION').should('be.visible')
    })
  })

  describe('RF-5.5 — Cursos por periodo y comentarios por materia', () => {
    beforeEach(() => {
      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains(docente1Name, { timeout: 20000 }).should('be.visible')
    })

    it('lista las materias que dictó el docente ese periodo', () => {
      cy.contains('h2', 'Resultados por asignatura').should('be.visible')

      cy.contains('ESTRUCTURAS DE DATOS').should('be.visible')
      cy.contains('FUNDAMENTOS DE PROGRAMACION').should('be.visible')
      cy.contains('CALCULO INTEGRAL').should('be.visible')
      cy.contains('PROGRAMACION WEB').should('be.visible')
    })

    it('agrupa los comentarios de los estudiantes por materia', () => {
      cy.contains('Buen acompanamiento en las asesorias, se nota que le gusta ensenar')
        .first()
        .closest('[data-slot="collapsible"]')
        .should('contain.text', 'FUNDAMENTOS DE PROGRAMACION')

      cy.contains('Organizado y puntual, los talleres practicos son muy utiles')
        .closest('[data-slot="collapsible"]')
        .should('contain.text', 'CALCULO INTEGRAL')
    })
  })

  describe('RF-5.8 — Comparación entre dos periodos académicos', () => {
    it('dibuja los dos periodos reales del docente, para leer la comparación entre ellos', () => {
      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains(docente1Name, { timeout: 20000 }).should('be.visible')

      cy.contains('h2', 'Evolución del promedio por periodo').scrollIntoView()

      cy.contains('2025-2').should('be.visible')
      cy.contains('2026-1').should('be.visible')
    })
  })

  describe('RF-5.9 — Descarga del reporte de evaluación', () => {
    beforeEach(() => {
      cy.visit(`/docentes/${teacherIds.docente1}?period=2026-1`)
      cy.contains(docente1Name, { timeout: 20000 }).should('be.visible')
    })

    it('ofrece descargar el reporte del docente en PDF', () => {
      cy.contains('button', 'Descargar reporte del docente').should('be.enabled')
    })

    it('ofrece ver el PDF original de la evaluación', () => {
      cy.contains('a, button', 'Ver evaluación en PDF').should('be.visible')
    })
  })
})
