/**
 * RF-5.1 (Alta) — Promedios del departamento por periodo y contraste del
 * periodo actual con el anterior.
 * RF-5.2 (Alta) — Reporte del departamento por rango de periodos, en su
 * versión general y en la versión por materias.
 *
 * Corre contra la pila real: la cuenta de pruebas es directora del
 * departamento "Sistemas" (código 52), que tiene evaluaciones reales
 * sembradas en tres periodos — 2025-1, 2025-2 y 2026-1 — así que las cifras
 * que se comprueban aquí son datos de verdad, no inventados (recalculadas
 * cada vez que otro spec de este mismo departamento siembra un docente o
 * periodo adicional). El contraste con el periodo anterior
 * (RF-5.1) se hace a través de "Comparar un rango de periodos": la
 * comparación automática contra el periodo inmediatamente anterior está
 * deshabilitada en el código (ver "MOVER BADGES DISABLED" en
 * DepartmentPeriodRangeSummary.tsx) a la espera de un arreglo del backend.
 */
/**
 * Espera a que el resumen realmente haya salido del esqueleto de carga. La
 * primera visita de cada corrida de Cypress hace que Vite compile en frío el
 * árbol pesado de esta pantalla (gráficas, generador de PDF), lo que puede
 * tardar bastante más que el timeout por defecto de 4s — nada que ver con un
 * fallo real de la app.
 */
function landOnSummary() {
  cy.contains('h2', 'Sistemas', { timeout: 20000 }).should('be.visible')
}

/**
 * Elige una opción de un `PeriodSelect` ya abierto. El popover del selector
 * anterior a veces sigue con `pointer-events: none` mientras termina de
 * cerrarse — una animación de Base UI, no un elemento realmente inalcanzable
 * — así que se fuerza el clic en vez de esperar a que Cypress lo considere
 * "accionable".
 */
function pickPeriodOption(code: string) {
  cy.contains('[data-slot="select-item"]:visible', code).click({ force: true })
}

describe('Resumen del departamento', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  describe('RF-5.1 — Promedios por periodo', () => {
    it('muestra el departamento y el promedio del periodo más reciente por defecto', () => {
      landOnSummary()
      cy.contains('Periodo evaluado').parent().should('contain.text', '2026-1')
      // 3.88 desde que se sembró un sexto docente (Sofia) en el departamento
      // — antes de esa siembra el promedio de 2026-1 era 3.92.
      cy.contains('Promedio general').next().should('contain.text', '3.88')
    })

    it('contrasta el periodo actual con el anterior al comparar un rango', () => {
      landOnSummary()
      cy.get('[data-slot="switch"]').click()

      cy.get('[aria-label="Periodo inicial"]').click()
      pickPeriodOption('2025-1')

      cy.get('[aria-label="Periodo final"]').click()
      pickPeriodOption('2026-1')

      // Rango real, hoy con tres periodos entre esos dos extremos —
      // 2025-1 (4.78), 2025-2 (4.00, sembrado para RF-5.3/5.8) y 2026-1
      // (3.88) — combinados dan 4.13 (confirmado por API).
      cy.contains('Periodo evaluado').parent().should('contain.text', '2025-1 — 2026-1')
      cy.contains('Promedio general').next().should('contain.text', '4.13')

      cy.contains('h2', 'Evolución del promedio por periodo').should('be.visible')
      cy.contains('2025-1').should('be.visible')
      cy.contains('2026-1').should('be.visible')
    })
  })

  describe('RF-5.2 — Reporte por rango de periodos', () => {
    it('pide la API con el rango exacto elegido', () => {
      landOnSummary()

      // `@apiRequest` (de watchApi en el beforeEach) ve toda petición a la
      // API, incluidas otras en curso al mismo tiempo (notificaciones, el
      // propio /users/auth) — un intercept propio evita esperar «la
      // siguiente que sea» y esperar justo la del rango.
      //
      // El intercept se registra después de activar el switch a propósito:
      // activarlo ya dispara su propia petición con el rango por defecto
      // (el periodo anterior al actual, hoy un 2025-2 real desde que existe
      // esa siembra) — si el intercept estuviera puesto antes, `cy.wait`
      // tomaría esa petición por defecto en vez de la que dispara elegir
      // "2025-1" a continuación.
      cy.get('[data-slot="switch"]').click()

      cy.intercept('**/stats/departments/period-range*').as('rangeRequest')

      cy.get('[aria-label="Periodo inicial"]').click()
      pickPeriodOption('2025-1')

      cy.wait('@rangeRequest').its('request.url').should('include', 'start_period=2025-1')
    })

    it('ofrece descargar el reporte del departamento una vez hay datos', () => {
      cy.contains('button', 'Descargar reporte del departamento').should('be.enabled')
    })

    describe('versión por materias', () => {
      beforeEach(() => {
        cy.visit('/materias?period=2026-1')
      })

      it('lista las materias del periodo con su promedio y número de docentes', () => {
        cy.contains('SISTEMAS OPERATIVOS').should('be.visible')
        // 3 desde que se sembró un sexto docente (Sofia) en esta materia
        // para poder probar la paginación del ranking (RF-5.6).
        cy.contains('3 docentes').should('be.visible')
      })

      it('expande una materia y muestra los docentes que la dictan', () => {
        cy.contains('SISTEMAS OPERATIVOS').closest('button').click()

        cy.contains('1155604').should('be.visible')
        cy.contains('1155604').closest('button').click()

        cy.contains('MARCO ANTONIO ADARME JAIMES').should('be.visible')
        cy.contains('JULIAN ALFONSO RODRIGUEZ CASTRO').should('be.visible')
        cy.contains('SOFIA VALENTINA MORENO RUIZ').should('be.visible')
      })
    })
  })
})
