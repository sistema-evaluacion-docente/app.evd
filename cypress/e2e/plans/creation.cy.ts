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
 * Corre contra la pila real. Dos fuentes de datos, según lo que cada prueba
 * necesita:
 *
 * - Las que pasan por el asistente (`/planes/nuevo`) necesitan un periodo con
 *   evaluación real `COMPLETED` — `GET /improvement-plans/periods` y
 *   `/candidates` solo devuelven lo que ya tiene una cargada. Usan el
 *   departamento `99` fijo y sus dos periodos reales (ver
 *   `evaluationFixtures.ts`), con un director desechable propio: docentes
 *   reales, promedio y situación confirmados contra la API antes de escribir
 *   estas pruebas —
 *     DOCENTE 1: 3.90 en 2026-1, sin nada bajo el umbral — sano.
 *     DOCENTE 2: 3.57 en 2026-1 (sano), pero con 7 preguntas bajo el
 *       umbral — sugerido solo por indicador.
 *     DOCENTE 3: 3.08 en 2026-1, bajo el umbral, y con las 22 preguntas
 *       también bajas — sugerido por las dos razones a la vez (no hay,
 *       con solo 3 docentes reales, un caso de "solo promedio, indicadores
 *       sanos" que aislar).
 *   La sugerencia por acumulación de comentarios de alto riesgo sigue sin
 *   poder probarse con datos reales: el análisis de IA corre, pero
 *   `risk_level` queda `null` para todo comentario en este entorno — bug
 *   real, reportado aparte (`task_26984f7a`), no de este spec.
 *
 * - Las que siembran el plan directo por API (periodo de origen, aislamiento
 *   por docente) no necesitan evaluación real — un docente y un periodo
 *   desechables (`planFixtures.ts`) bastan, y corren con la cuenta de
 *   pruebas de siempre.
 */

import { directorDepartmentId, ownTeacherId, seedPeriod, seedTeacher } from '../../support/planFixtures'
import {
  createDirectorAccount,
  seedFixtureEvaluations,
  findOrCreateFixtureDepartment,
  type DirectorAccount,
} from '../../support/evaluationFixtures'

const marca = `${Date.now()}`

/** Docente y periodo desechables, para las dos pruebas que siembran el plan por API. */
let otherTeacherId: number
let selfTeacherId: number
let periodName: string
let periodId: number

/** Departamento 99 fijo, con las dos evaluaciones reales cargadas — para las pruebas que pasan por el asistente. */
let fixtureDepartment: { id: number }
let fixtureDirector: DirectorAccount

before(() => {
  directorDepartmentId().then((departmentId) => {
    seedTeacher(`Docente Creación ${marca}`, departmentId).then((id) => (otherTeacherId = id))
  })
  ownTeacherId().then((id) => (selfTeacherId = id))
  periodName = `Periodo Creación ${marca}`
  seedPeriod(periodName).then((id) => (periodId = id))

  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount('creacion').then((account) => {
      fixtureDirector = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
      seedFixtureEvaluations(account)
    })
  })
})

after(() => {
  cy.api('DELETE', `/teachers/${otherTeacherId}`)
  cy.api('DELETE', `/academic-periods/${periodId}`)

  cy.apiAs(
    fixtureDirector.email,
    fixtureDirector.password,
    'GET',
    `/evaluations/?department_id=${fixtureDepartment.id}`,
  ).then((response) => {
    const evaluations = (response.body as { data: Array<{ id: number }> }).data
    for (const evaluation of evaluations) {
      cy.apiAs(fixtureDirector.email, fixtureDirector.password, 'DELETE', `/evaluations/${evaluation.id}`)
    }
  })
  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${fixtureDirector.uid}/status`, { active: false })
})

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

/** Sesión como el director desechable del departamento 99 — para las pruebas que pasan por el asistente. */
function loginAsFixtureDirector() {
  cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
  cy.loginWithEmail(fixtureDirector.email, fixtureDirector.password)
  cy.location('pathname').should('eq', '/home')
}

describe('Creación de planes de mejoramiento', () => {
  let createdPlanIds: number[] = []
  // Planes creados como el director desechable del departamento 99 — solo
  // ese director (no la cuenta de pruebas de siempre) puede borrarlos.
  let fixtureCreatedPlanIds: number[] = []

  beforeEach(() => {
    createdPlanIds = []
    fixtureCreatedPlanIds = []
    cy.watchApi()
  })

  afterEach(() => {
    for (const id of createdPlanIds) {
      cy.api('DELETE', `/improvement-plans/${id}`)
    }
    for (const id of fixtureCreatedPlanIds) {
      cy.apiAs(fixtureDirector.email, fixtureDirector.password, 'DELETE', `/improvement-plans/${id}`)
    }
  })

  describe('RF-6.1 — sugerencia de candidatos', () => {
    beforeEach(() => {
      loginAsFixtureDirector()
      cy.visit('/planes/nuevo')
      cy.contains('label', 'Periodo de origen', { timeout: 20000 }).should('be.visible')
      pickPeriod('2026-1')
    })

    it('sugiere por promedio general y por indicadores bajo el umbral a la vez', () => {
      openTeacherPicker()
      cy.get('#teacher').type('DOCENTE 3')

      cy.contains('[role="option"]', 'DOCENTE 3')
        .should('contain.text', 'promedio general bajo el umbral')
        .and('contain.text', 'indicadores bajo el umbral')
    })

    it('sugiere por un indicador bajo el umbral, con el promedio general sano', () => {
      openTeacherPicker()
      cy.get('#teacher').type('DOCENTE 2')

      cy.contains('[role="option"]', 'DOCENTE 2')
        .should('contain.text', 'indicadores bajo el umbral')
        .and('not.contain.text', 'promedio general')
    })

    it('no sugiere nada para un docente sano', () => {
      openTeacherPicker()
      cy.get('#teacher').type('DOCENTE 1')

      cy.contains('[role="option"]', 'DOCENTE 1').should('not.contain.text', 'Plan sugerido')
    })
  })

  describe('RF-6.2/6.3 — ciclo de creación y periodo de origen', () => {
    it('crea un plan real de principio a fin y aparece en el listado del director', () => {
      loginAsFixtureDirector()

      const title = `Plan de prueba Cypress ${marca}`

      cy.visit('/planes/nuevo')
      cy.contains('label', 'Periodo de origen', { timeout: 20000 }).should('be.visible')
      pickPeriod('2026-1')

      openTeacherPicker()
      cy.get('#teacher').type('DOCENTE 1')
      cy.contains('[role="option"]', 'DOCENTE 1').click()

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
        fixtureCreatedPlanIds.push(id)
      })

      cy.contains('h1', title).should('be.visible')
      cy.contains('DOCENTE 1').should('be.visible')

      // Y de verdad quedó filed en el listado del director, no solo en el detalle.
      cy.visit('/planes?periodo=todos')
      cy.contains(title, { timeout: 20000 }).should('be.visible')
    })

    it('el periodo de origen queda fijo aunque el plan avance', () => {
      cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/home')

      cy.api('POST', '/improvement-plans/', {
        teacher_id: otherTeacherId,
        origin_period_id: periodId,
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
        cy.contains(`Periodo ${periodName}`, { timeout: 20000 }).should('be.visible')

        // Editar otros datos del plan no debe tocar el periodo de origen.
        cy.visit(`/planes/${id}/editar`)
        cy.get('#plan-desc').type('Seguimiento cercano')
        cy.contains('button', /Guardar cambios/).click()

        cy.location('pathname', { timeout: 20000 }).should('eq', `/planes/${id}`)
        cy.contains(`Periodo ${periodName}`).should('be.visible')
      })
    })
  })

  describe('RF-6.2 — el docente solo ve sus propios planes', () => {
    it('en /mis-planes no aparece el plan de otro docente', () => {
      cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/home')

      // Dos planes reales, de dos docentes distintos — uno de ellos es la
      // misma cuenta de pruebas, que también opera como DOCENTE.
      cy.api('POST', '/improvement-plans/', {
        teacher_id: selfTeacherId,
        origin_period_id: periodId,
        title: `Plan propio del docente ${marca}`,
      }).then((response) => {
        createdPlanIds.push((response.body as { data: { id: number } }).data.id)
      })

      cy.api('POST', '/improvement-plans/', {
        teacher_id: otherTeacherId,
        origin_period_id: periodId,
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
      loginAsFixtureDirector()

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
      cy.get('#teacher').type('DOCENTE 1')
      cy.contains('[role="option"]', 'DOCENTE 1').click()

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
