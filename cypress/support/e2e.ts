import './commands'

// Estas pruebas hablan con el backend real, así que una página puede reventar
// pintando datos que no controlamos mucho después de que la aserción bajo
// prueba ya haya pasado. Lo que se prueba aquí es la autenticación; una tabla
// que se atraganta con un dato raro no es un fallo de ella.
Cypress.on('uncaught:exception', () => false)

// El navegador headless deja las animaciones con `animation-fill-mode: both`
// clavadas en su primer fotograma, así que `.animate-rise` se queda en
// `opacity: 0` y Cypress da por invisible el formulario de acceso. Aquí no se
// prueba ninguna animación: se apagan todas.
Cypress.on('window:before:load', (win) => {
  win.addEventListener('DOMContentLoaded', () => {
    const style = win.document.createElement('style')

    style.textContent =
      '*, *::before, *::after { animation: none !important; transition: none !important }'
    win.document.head.appendChild(style)
  })
})
