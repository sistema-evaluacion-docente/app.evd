import { credentials } from '../../support/commands'

/**
 * RF — Inicio de sesión con correo y con cuenta de Google.
 *
 * Sin dobles: Firebase autentica de verdad y la API real responde. La única
 * pieza fuera de alcance es la ventana de consentimiento de Google, que es de
 * un tercero y Cypress no puede conducir; de ese flujo se comprueba lo que sí
 * es nuestro, que el botón lo arranca contra el proveedor correcto.
 */
describe('Inicio de sesión', () => {
  beforeEach(() => {
    cy.watchApi()
  })

  describe('con correo y contraseña', () => {
    it('entra al sistema y aterriza en el resumen', () => {
      cy.visitApp('/login')

      cy.loginWithEmail()

      cy.contains('Bienvenido').should('be.visible')
      cy.location('pathname').should('eq', '/home')

      // La sesión es real: el backend devolvió el perfil de esta cuenta.
      cy.wait('@apiRequest').then(({ request, response }) => {
        expect(request.headers.authorization).to.match(/^Bearer \S+\.\S+\.\S+$/)
        expect(response?.statusCode).to.eq(200)
      })
    })

    it('rechaza una contraseña incorrecta y no abre sesión', () => {
      cy.visitApp('/login')

      credentials().then(({ email }) => cy.loginWithEmail(email, 'contrasena-que-no-es'))

      cy.contains('Invalid authentication credential.').should('be.visible')
      cy.location('pathname').should('eq', '/login')
      cy.get('@apiRequest.all').should('have.length', 0)
    })

    it('rechaza una cuenta que no existe', () => {
      cy.visitApp('/login')

      cy.loginWithEmail('no-existe@ufps.edu.co', 'contrasena-que-no-es')

      cy.contains(/Invalid authentication credential\.|no user corresponding/).should('be.visible')
      cy.location('pathname').should('eq', '/login')
    })

    it('no llama a Firebase si falta el correo o la contraseña', () => {
      cy.visitApp('/login')

      cy.intercept({ method: 'POST', url: /accounts:signInWithPassword/ }).as('firebaseSignIn')

      cy.get('[data-testid="login-submit"]').click()

      cy.contains('Ingrese su correo y contraseña').should('be.visible')
      cy.get('@firebaseSignIn.all').should('have.length', 0)
    })

    it('devuelve al usuario a donde iba antes de que le pidieran iniciar sesión', () => {
      cy.visitApp('/notificaciones')

      cy.location('pathname').should('eq', '/login')
      cy.location('search').should('eq', '?next=%2Fnotificaciones')

      cy.loginWithEmail()

      cy.location('pathname').should('eq', '/notificaciones')
    })
  })

  describe('con cuenta de Google', () => {
    it('abre el consentimiento de Google contra el proyecto de Firebase', () => {
      cy.visit('/login', {
        onBeforeLoad(win) {
          win.indexedDB.deleteDatabase('firebaseLocalStorageDb')
          // La ventana emergente es de Google: se intercepta para leer a dónde
          // apunta en lugar de intentar rellenarla.
          cy.stub(win, 'open').as('popup')
        },
      })

      cy.get('[data-testid="login-google"]').click()

      cy.contains('Verificando cuenta').should('be.visible')
      cy.get('@popup')
        .should('have.been.called')
        .its('firstCall.args.0')
        .should('include', `https://${Cypress.expose('authDomain')}/__/auth/handler`)
        .and('include', 'providerId=google.com')
    })
  })
})
