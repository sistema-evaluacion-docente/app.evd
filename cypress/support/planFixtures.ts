/**
 * Docentes y periodos desechables para las pruebas de planes de mejoramiento —
 * mismo criterio que `cypress/e2e/admin/academic-groups.cy.ts`: creados por
 * API en el `before` de cada spec y borrados al terminar, en vez de asumir
 * IDs de una base ya sembrada a mano en un entorno concreto.
 *
 * `POST /academic-periods/` y `POST /teachers/with-user` exigen ADMIN — la
 * cuenta de pruebas ya lo tiene (`E2E.md` lo exige para toda la suite), así
 * que estas llamadas funcionan aunque el spec haya iniciado sesión como
 * DIRECTOR DE DEPARTAMENTO: el rol elegido en la interfaz no cambia los roles
 * reales del token que usa `cy.api()`.
 */

/** El `department_id` de la cuenta de pruebas, para crear docentes en su mismo departamento. */
export function directorDepartmentId(): Cypress.Chainable<number> {
  return cy
    .api('GET', '/users/auth')
    .then(
      (response) =>
        (response.body as { data: { department_id: number } }).data.department_id,
    )
}

/** El `teacher_id` de la propia cuenta de pruebas — para lo que debe ser el docente que inicia sesión, no un docente cualquiera. */
export function ownTeacherId(): Cypress.Chainable<number> {
  return cy
    .api('GET', '/users/auth')
    .then((response) => (response.body as { data: { teacher_id: number } }).data.teacher_id)
}

/**
 * Un periodo académico desechable. `code` es lo que de verdad se ve en la
 * interfaz (`PlanDetailPage` pinta `Periodo {origin_period_code}`, no el
 * `name`), así que se fija igual al `name` para que las pruebas puedan
 * afirmar contra un único texto conocido.
 */
export function seedPeriod(name: string): Cypress.Chainable<number> {
  return cy
    .api('POST', '/academic-periods/', { name, code: name })
    .then((response) => (response.body as { data: { id: number } }).data.id)
}

/**
 * Un docente desechable, con usuario real (para que su nombre se vea en la
 * interfaz) en el departamento indicado — crear un plan para un docente de
 * otro departamento lo rechaza (`ensure_can_manage` en `api.evd`).
 */
export function seedTeacher(name: string, departmentId: number): Cypress.Chainable<number> {
  // `institutional_code` exige solo dígitos (ver `academic-groups.cy.ts`) —
  // el timestamp basta, ya es único de por sí.
  const code = `${Date.now()}${Math.floor(Math.random() * 1000)}`

  return cy
    .api('POST', '/teachers/with-user', {
      email: `e2e-${code}@ufps.edu.co`,
      name,
      institutional_code: code,
      department_id: departmentId,
    })
    .then((response) => (response.body as { data: { id: number } }).data.id)
}
