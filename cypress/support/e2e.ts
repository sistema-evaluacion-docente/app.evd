import 'cypress-mochawesome-reporter/register'

import './commands'

// Estas pruebas hablan con el backend real, así que una página puede reventar
// pintando datos que no controlamos mucho después de que la aserción bajo
// prueba ya haya pasado. Lo que se prueba aquí es la autenticación; una tabla
// que se atraganta con un dato raro no es un fallo de ella.
Cypress.on('uncaught:exception', () => false)
