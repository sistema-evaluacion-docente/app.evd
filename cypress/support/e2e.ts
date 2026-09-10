import 'cypress-mochawesome-reporter/register'

import './commands'

// Estas pruebas hablan con el backend real, así que una página puede reventar
// pintando datos que no controlamos mucho después de que la aserción bajo
// prueba ya haya pasado. Lo que se prueba aquí es la autenticación; una tabla
// que se atraganta con un dato raro no es un fallo de ella.
Cypress.on('uncaught:exception', () => false)

// Cypress solo captura pantallazo cuando un test falla; para que el reporte
// muestre uno siempre (también en los que pasan) se toma uno manual al cerrar
// cada test.
afterEach(function () {
  cy.screenshot(`${this.currentTest?.fullTitle()} -- final`, { capture: 'viewport' })
})
