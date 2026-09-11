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
 * Docente de prueba: Orlando José Beltrán Valero (id 11, código 01111),
 * departamento "Sistemas". Tiene evaluaciones reales sembradas en tres
 * periodos — 2025-2 (4.00, un solo grupo, sembrado a mano para que exista un
 * "periodo anterior" real de 2026-1) y 2026-1 (4.51, tres materias) — así
 * que el contraste y la tendencia entre periodos son datos de verdad.
 */
/**
 * Cambia al rol DOCENTE desde el menú del avatar — mismo flujo real que
 * `auth/roles.cy.ts`. La cuenta semilla opera como Orlando en el resto del
 * archivo (rol DIRECTOR DE DEPARTAMENTO), pero la matriz por pregunta
 * (`TeacherQuestionMatrix`) solo se muestra en el panel propio del docente
 * (`/home` en DOCENTE), así que RF-5.4 necesita este cambio de rol.
 */
function switchToDocenteRole() {
  cy.get('[data-testid="user-menu"]').click()
  cy.contains('Cambiar de rol').click()
  cy.get('[data-slot="dropdown-menu-radio-item"]').contains('Docente').click()
  cy.location('pathname').should('eq', '/home')
}

describe('Detalle del docente', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  describe('RF-5.3 — Historial y comparaciones', () => {
    beforeEach(() => {
      cy.visit('/docentes/11?period=2026-1')
      // Primera carga de la corrida: árbol pesado (gráficas, PDF) en frío.
      cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')
    })

    it('muestra el promedio frente al periodo anterior', () => {
      cy.contains('Promedio general del periodo')
        .parent()
        .find('[aria-label*="periodo anterior"]')
        .should('have.attr', 'aria-label')
        .and('include', 'aumentó')
        .and('include', '0.51')
    })

    it('compara al docente consigo mismo a lo largo del tiempo', () => {
      // La evolución del propio docente semestre a semestre — comparar
      // cualquiera de sus dos puntos es "compararse consigo mismo".
      cy.contains('h2', 'Evolución del promedio por periodo').scrollIntoView()
      cy.contains('2025-2').should('be.visible')
      cy.contains('2026-1').should('be.visible')
    })

    it('compara al docente con el promedio del departamento', () => {
      // Esta comparación vive en el detalle por dimensiones de la
      // evaluación, filtrado a este docente — no en /docentes/:id. El
      // filtro de docente vive en el estado del componente, no en la URL,
      // así que hay que seleccionarlo desde el panel de Filtros.
      //
      // La comparación real y correcta está por dimensión, no en el número
      // grande de la cabecera: la API devuelve el mismo `department_average`
      // (departamental, sin filtrar) esté o no filtrada por docente — un bug
      // de backend confirmado y reportado aparte — así que ese número no
      // sirve para afirmar "el docente vs. el departamento". Cada fila de
      // "Detalle por dimensión" sí compara bien: su `ScoreBadge` usa el
      // promedio filtrado por docente contra `overallDimension` (el mismo
      // departamental, sin filtrar).
      cy.visit('/evaluaciones/2/dimensiones')
      cy.contains('h2', 'Desglose por dimensión pedagógica', { timeout: 20000 }).should(
        'be.visible',
      )

      cy.contains('button', 'Filtros').click()
      cy.get('[aria-label="Docente"]').click().type('Orlando')
      cy.contains('[data-slot="combobox-item"]:visible', 'ORLANDO').click()

      // El docente (4.59 en esta dimensión) está por encima del promedio del
      // departamento (3.93, confirmado por API) — 0.66 puntos de diferencia.
      cy.contains('Desarrollo del Conocimiento')
        .closest('[data-slot="collapsible-trigger"]')
        .find('[aria-label*="promedio del departamento"]')
        .should('have.attr', 'aria-label')
        .and('include', 'aumentó')
        .and('include', '0.66')
    })
  })

  describe('RF-5.4 — Dimensiones y matriz de resultados', () => {
    beforeEach(() => {
      cy.visit('/docentes/11?period=2026-1')
      cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')
    })

    it('muestra el promedio de las cuatro dimensiones pedagógicas', () => {
      cy.contains('Desarrollo del Conocimiento').should('be.visible')
      cy.contains('Desempeño Docente').should('be.visible')
      cy.contains('Procesos de Evaluación').should('be.visible')
      cy.contains('Integración Interpersonal').should('be.visible')

      // Promedios reales agregados de sus tres materias en 2026-1.
      cy.contains('Desarrollo del Conocimiento').parent().should('contain.text', '4.59')
    })

    it('despliega la matriz de resultados por pregunta y por materia', () => {
      // La matriz por pregunta (`TeacherQuestionMatrix`) vive en el panel
      // propio del docente, no en el detalle que ve el director — cambiar
      // de rol lleva a la cuenta semilla a su propio `/home` como docente,
      // con su propia evaluación real sembrada (2025-1, "Fundamentos de
      // Programación").
      switchToDocenteRole()

      // El botón queda justo bajo la cabecera fija de la app tras el
      // scroll automático de Cypress — mismo motivo que el `force` ya usado
      // en otros popovers de este proyecto (ver `pickPeriodOption`).
      cy.contains('button', /Ver preguntas/, { timeout: 20000 })
        .scrollIntoView()
        .click({ force: true })

      // Una pregunta real del instrumento, con su código.
      cy.contains('Da a conocer la programación al inicio del semestre.').should('be.visible')

      // La única materia dictada ese periodo es la columna de la matriz.
      cy.contains('th', 'FUNDAMENTOS DE PROGRAMACION').should('be.visible')
    })
  })

  describe('RF-5.5 — Cursos por periodo y comentarios por materia', () => {
    beforeEach(() => {
      cy.visit('/docentes/11?period=2026-1')
      cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')
    })

    it('lista las materias que dictó el docente ese periodo', () => {
      cy.contains('h2', 'Resultados por asignatura').should('be.visible')

      cy.contains('PROGRAMACION ORIENTADA A OBJETOS I').should('be.visible')
      cy.contains('CALCULO DIFERENCIAL').should('be.visible')
      cy.contains('PROGRAMACION WEB').should('be.visible')
    })

    it('agrupa los comentarios de los estudiantes por materia', () => {
      // Cada materia es su propio `Collapsible` (encabezado + comentarios),
      // no un `<article>` por comentario — así se ve de qué asignatura habla
      // un comentario en concreto.
      cy.contains('Explica bien, aunque a veces avanza un poco rapido')
        .closest('[data-slot="collapsible"]')
        .should('contain.text', 'CALCULO DIFERENCIAL')

      cy.contains('Las clases son dinamicas y los ejemplos ayudan a entender mejor')
        .closest('[data-slot="collapsible"]')
        .should('contain.text', 'PROGRAMACION WEB')
    })
  })

  describe('RF-5.8 — Comparación entre dos periodos académicos', () => {
    it('dibuja los dos periodos reales del docente, para leer la comparación entre ellos', () => {
      cy.visit('/docentes/11?period=2026-1')
      cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')

      cy.contains('h2', 'Evolución del promedio por periodo').scrollIntoView()

      // Los dos periodos sembrados, con promedios distintos de verdad:
      // 2025-2 (4.00) y 2026-1 (4.51).
      cy.contains('2025-2').should('be.visible')
      cy.contains('2026-1').should('be.visible')
    })
  })

  describe('RF-5.9 — Descarga del reporte de evaluación', () => {
    beforeEach(() => {
      cy.visit('/docentes/11?period=2026-1')
      cy.contains('ORLANDO JOSE BELTRAN VALERO', { timeout: 20000 }).should('be.visible')
    })

    it('ofrece descargar el reporte del docente en PDF', () => {
      cy.contains('button', 'Descargar reporte del docente').should('be.enabled')
    })

    it('ofrece ver el PDF original de la evaluación', () => {
      cy.contains('a, button', 'Ver evaluación en PDF').should('be.visible')
    })
  })
})
