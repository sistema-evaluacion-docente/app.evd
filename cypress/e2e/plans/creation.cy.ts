/**
 * RF-6.1 (Alta) — Sugerencia de candidatos por umbral institucional en
 * promedio o en cualquier indicador y por acumulación de comentarios de
 * riesgo alto.
 * RF-6.2 (Alta) — Ciclo completo del plan y acceso del docente restringido a
 * sus propios planes.
 * RF-6.3 (Alta) — Registro del periodo de origen y permanencia de ese dato
 * mientras el plan avanza.
 * RF-6.6 (Media) — Catálogo de acciones sugeridas por defecto del
 * departamento.
 *
 * Corre contra la pila real, departamento "Sistemas" (código 52), periodo
 * 2026-1 salvo donde se indique. Docentes reales usados, con su promedio y
 * situación real confirmados contra la API antes de escribir estas pruebas:
 *   - SOFIA VALENTINA MORENO RUIZ (id 15): 3.20, ningún indicador bajo el
 *     umbral — sugerida solo por el promedio general.
 *   - JULIAN ALFONSO RODRIGUEZ CASTRO TP (id 13): 3.57 (sano, por encima del
 *     umbral de 3.5), pero con 7 indicadores bajo el umbral — sugerido solo
 *     por indicador, con el promedio sano.
 *   - MAURICIO DI DONATO SANCHEZ (id 12): 3.90, sin nada bajo el umbral — no
 *     se le sugiere plan.
 *   - PEREZ PEREZ HC (id 14): usado para el ciclo completo de creación.
 *
 * La sugerencia por acumulación de comentarios de alto riesgo no se prueba
 * aquí con datos reales: ningún docente del departamento tiene hoy un
 * comentario clasificado como alto riesgo (confirmado contra la API), y
 * fabricar esa clasificación a mano contradice el criterio de este spec de
 * sembrar datos solo a través de la propia canalización del backend. Esa vía
 * ya está probada exhaustivamente en unitarias (planSuggestion.test.ts).
 */

const marca = `${Date.now()}`

/** Abre el buscador de docentes del formulario de creación. */
function openTeacherPicker() {
  cy.get('#teacher').click()
}

/** Elige un periodo de origen en el select del paso 1. */
function pickPeriod(code: string) {
  cy.get('#period').click()
  cy.contains('[data-slot="select-item"]:visible', code).click()
}

/** Redacta un compromiso a mano en el aspecto dado y lo guarda. */
function addManualCommitment(aspectLabel: string, title: string, description: string) {
  cy.contains('button', /Añadir compromiso/).click()
  cy.contains('[role="menuitem"]', aspectLabel).click()
  cy.contains('label', 'Título del compromiso').parent().find('textarea').type(title)
  cy.contains('label', 'Descripción del compromiso')
    .parent()
    .find('textarea')
    .type(description)
  cy.contains('[role="dialog"] button', 'Guardar').click()
}

describe('Creación de planes de mejoramiento', () => {
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

  describe('RF-6.1 — sugerencia de candidatos', () => {
    beforeEach(() => {
      cy.visit('/planes/nuevo')
      cy.contains('label', 'Periodo de origen', { timeout: 20000 }).should('be.visible')
      pickPeriod('2026-1')
    })

    it('sugiere por promedio general bajo el umbral, con los indicadores sanos', () => {
      openTeacherPicker()
      cy.get('#teacher').type('SOFIA')

      cy.contains('[role="option"]', 'SOFIA VALENTINA MORENO RUIZ')
        .should('contain.text', 'promedio general bajo el umbral')
        .and('not.contain.text', 'indicador')
    })

    it('sugiere por un indicador bajo el umbral, con el promedio general sano', () => {
      openTeacherPicker()
      cy.get('#teacher').type('JULIAN')

      cy.contains('[role="option"]', 'JULIAN ALFONSO RODRIGUEZ CASTRO')
        .should('contain.text', 'indicadores bajo el umbral')
        .and('not.contain.text', 'promedio general')
    })

    it('no sugiere nada para un docente sano', () => {
      openTeacherPicker()
      cy.get('#teacher').type('MAURICIO')

      cy.contains('[role="option"]', 'MAURICIO DI DONATO SANCHEZ').should(
        'not.contain.text',
        'Plan sugerido',
      )
    })
  })

  describe('RF-6.2/6.3 — ciclo de creación y periodo de origen', () => {
    it('crea un plan real de principio a fin y aparece en el listado del director', () => {
      const title = `Plan de prueba Cypress ${marca}`

      cy.visit('/planes/nuevo')
      cy.contains('label', 'Periodo de origen', { timeout: 20000 }).should('be.visible')
      pickPeriod('2026-1')

      openTeacherPicker()
      cy.get('#teacher').type('PEREZ')
      cy.contains('[role="option"]', 'PEREZ PEREZ HC').click()

      addManualCommitment(
        'Desempeño Docente',
        'Puntualidad',
        'Llegar a tiempo a todas las clases del periodo',
      )

      cy.get('#title').clear().type(title)
      cy.get('#acta-number').type('099')

      cy.contains('button', /Crear plan/).click()

      // La creación real navega al detalle del plan recién creado.
      cy.location('pathname', { timeout: 20000 }).should('match', /^\/planes\/\d+$/)
      cy.location('pathname').then((pathname) => {
        const id = Number(pathname.split('/').pop())
        createdPlanIds.push(id)
      })

      cy.contains('h1', title).should('be.visible')
      cy.contains('PEREZ PEREZ HC').should('be.visible')

      // Y de verdad quedó filed en el listado del director, no solo en el detalle.
      cy.visit('/planes?periodo=todos')
      cy.contains(title, { timeout: 20000 }).should('be.visible')
    })

    it('el periodo de origen queda fijo aunque el plan avance', () => {
      cy.api('POST', '/improvement-plans/', {
        teacher_id: 14,
        origin_period_id: 2,
        title: `Plan periodo de origen ${marca}`,
        // Con al menos un compromiso, una asignatura y los datos del acta,
        // para que el formulario de edición no bloquee el guardado por
        // faltarle todo eso — lo que se prueba aquí es el periodo de
        // origen, no la validación del wizard.
        acta_number: '099',
        acta_date: '2026-01-15',
        items: [
          {
            description: 'Asistir puntualmente a clase',
            commitment: 'Llegar a tiempo a todas las clases del periodo',
            aspect: 2,
          },
        ],
        courses: [{ course_name: 'Cálculo Diferencial' }],
      }).then((response) => {
        const id = (response.body as { data: { id: number } }).data.id
        createdPlanIds.push(id)

        cy.visit(`/planes/${id}`)
        cy.contains('Periodo 2026-1', { timeout: 20000 }).should('be.visible')

        // Editar otros datos del plan no debe tocar el periodo de origen.
        cy.visit(`/planes/${id}/editar`)
        cy.get('#plan-desc').type('Seguimiento cercano')
        cy.contains('button', /Guardar cambios/).click()

        cy.location('pathname', { timeout: 20000 }).should('eq', `/planes/${id}`)
        cy.contains('Periodo 2026-1').should('be.visible')
      })
    })
  })

  describe('RF-6.2 — el docente solo ve sus propios planes', () => {
    it('en /mis-planes no aparece el plan de otro docente', () => {
      // Dos planes reales, de dos docentes distintos — uno de ellos (teacher_id
      // 1) es la misma cuenta de pruebas, que también opera como DOCENTE.
      cy.api('POST', '/improvement-plans/', {
        teacher_id: 1,
        origin_period_id: 1,
        title: `Plan propio del docente ${marca}`,
      }).then((response) => {
        createdPlanIds.push((response.body as { data: { id: number } }).data.id)
      })

      cy.api('POST', '/improvement-plans/', {
        teacher_id: 14,
        origin_period_id: 2,
        title: `Plan de otro docente ${marca}`,
      }).then((response) => {
        createdPlanIds.push((response.body as { data: { id: number } }).data.id)
      })

      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Cambiar de rol').click()
      cy.get('[data-slot="dropdown-menu-radio-item"]').contains('Docente').click()
      cy.location('pathname').should('eq', '/home')

      cy.visit('/mis-planes')
      cy.contains(`Plan propio del docente ${marca}`, { timeout: 20000 }).should('be.visible')
      cy.contains(`Plan de otro docente ${marca}`).should('not.exist')
    })
  })

  describe('RF-6.6 — catálogo de acciones sugeridas del departamento', () => {
    it('una acción del catálogo aparece y se puede usar al redactar un compromiso', () => {
      const actionText = `Socializar la rúbrica de evaluación ${marca}`

      cy.visit('/acciones')
      cy.contains('button', 'Nueva acción', { timeout: 20000 }).click()

      cy.contains('label', 'Aspecto del formato').parent().find('[data-slot="select-trigger"]').click()
      cy.contains('[data-slot="select-item"]:visible', 'Desempeño Docente').click()
      cy.contains('label', 'Acción').parent().find('textarea').type(actionText)
      cy.contains('[role="dialog"] button', 'Guardar').click()

      cy.contains(actionText, { timeout: 20000 }).should('be.visible')

      // La misma acción, ofrecida de verdad al redactar un compromiso de ese
      // aspecto en un plan nuevo.
      cy.visit('/planes/nuevo')
      cy.contains('label', 'Periodo de origen', { timeout: 20000 }).should('be.visible')
      pickPeriod('2026-1')

      openTeacherPicker()
      cy.get('#teacher').type('MAURICIO')
      cy.contains('[role="option"]', 'MAURICIO DI DONATO SANCHEZ').click()

      cy.contains('button', /Añadir compromiso/).click()
      cy.contains('[role="menuitem"]', 'Desempeño Docente').click()

      // Scoped to the open dialog: the sidebar also has an "Acciones
      // sugeridas" link, and `cy.contains` would otherwise match that one
      // first — it comes earlier in the DOM.
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', /Acciones sugeridas/).click()
        cy.contains('button', actionText).click()
      })

      cy.contains('label', 'Descripción del compromiso')
        .parent()
        .find('textarea')
        .should('have.value', actionText)
    })
  })
})
