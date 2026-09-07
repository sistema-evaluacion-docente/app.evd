import { apiUrl } from '../../support/commands'
import { bearerToken, decodeToken, makeExpiredIdToken } from '../../support/tokens'

/**
 * RF — Validación del token en cada petición y rechazo del token vencido o
 * ausente.
 *
 * El rechazo lo emite la API real: aquí solo se estropea la credencial que sale
 * del navegador y se comprueba qué contesta el backend y qué hace la app con
 * esa respuesta.
 */
describe('Token de sesión', () => {
  it('firma cada petición al backend con el ID token de Firebase', () => {
    cy.watchApi()
    cy.visitApp('/login')

    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')

    cy.wait('@apiRequest')

    // Navegación dentro de la app: ninguna petición sale sin firmar, y todas
    // llevan un token vigente de esta sesión.
    cy.visit('/notificaciones')
    cy.wait('@apiRequest')

    cy.get('@apiRequest.all').then((calls) => {
      const requests = calls as unknown as Array<{ request: { headers: Record<string, string> } }>

      expect(requests.length, 'peticiones observadas').to.be.greaterThan(0)

      requests.forEach(({ request }) => {
        const token = bearerToken(request.headers.authorization)

        expect(token, 'cabecera Authorization').to.not.equal('')

        const claims = decodeToken(token)

        expect(claims.exp, 'expiración del token').to.be.greaterThan(Date.now() / 1000)
        expect(claims.user_id ?? claims.sub, 'sujeto del token').to.be.a('string')
      })
    })
  })

  it('no envía ninguna petición sin sesión y manda al login', () => {
    cy.watchApi()

    cy.visitApp('/notificaciones')

    cy.location('pathname').should('eq', '/login')
    cy.contains('Acceso al sistema').should('be.visible')
    cy.get('@apiRequest.all').should('have.length', 0)
  })

  it('la API rechaza una petición sin token', () => {
    cy.request({
      url: apiUrl('/users/auth'),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'sin cabecera Authorization').to.eq(401)
      expect(response.body.error.code).to.eq('AUTHENTICATION_FAILED')
    })
  })

  it('la API rechaza un token vencido', () => {
    cy.request({
      url: apiUrl('/users/auth'),
      headers: { Authorization: `Bearer ${makeExpiredIdToken()}` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, 'token caducado').to.eq(401)
      expect(response.body.error.code).to.eq('AUTHENTICATION_FAILED')
    })
  })

  it('deja al usuario fuera cuando el backend rechaza el token vencido', () => {
    cy.tamperToken('expired')
    cy.visitApp('/login')

    cy.loginWithEmail()

    cy.wait('@apiRequest').its('response.statusCode').should('eq', 401)
    cy.contains('Autenticación fallida').should('be.visible')

    // La sesión de Firebase existe, pero sin perfil autorizado la app no abre.
    cy.location('pathname').should('eq', '/login')

    cy.visit('/home')
    cy.contains('Acceso no autorizado').should('be.visible')
  })

  it('deja al usuario fuera cuando la petición viaja sin token', () => {
    cy.tamperToken('missing')
    cy.visitApp('/login')

    cy.loginWithEmail()

    cy.wait('@apiRequest').then(({ request, response }) => {
      expect(request.headers.authorization, 'cabecera enviada').to.equal(undefined)
      expect(response?.statusCode).to.equal(401)
    })

    cy.contains('Autenticación fallida').should('be.visible')

    cy.location('pathname').should('eq', '/login')
  })

  it('conserva la sesión al recargar y sigue firmando las peticiones', () => {
    cy.watchApi()
    cy.visitApp('/login')

    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')

    cy.reload()

    cy.wait('@apiRequest')
      .its('request.headers.authorization')
      .should('match', /^Bearer \S+/)
    cy.location('pathname').should('eq', '/home')
  })
})
