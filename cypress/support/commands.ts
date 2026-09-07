import { makeExpiredIdToken } from './tokens'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      visitApp(path: string, role?: string): Chainable<void>
      api(method: string, path: string, body?: unknown): Chainable<Cypress.Response<unknown>>
      apiAs(
        email: string,
        password: string,
        method: string,
        path: string,
        body?: unknown,
      ): Chainable<Cypress.Response<unknown>>
      watchApi(): Chainable<void>
      tamperToken(mode: 'expired' | 'missing'): Chainable<void>
      loginWithEmail(email?: string, password?: string): Chainable<void>
    }
  }
}

/** URL absoluta de un recurso de la API real. */
export function apiUrl(path = ''): string {
  return `${Cypress.expose('apiUrl')}${path}`
}

/**
 * Credenciales de la cuenta de pruebas. Son sensibles, así que viven en `env`
 * (Cypress las oculta de los logs) y se leen con `cy.env`. Falla con un mensaje
 * claro en vez de dejar que el formulario se envíe vacío y la prueba muera diez
 * pasos después.
 */
export function credentials(): Cypress.Chainable<{ email: string; password: string }> {
  return cy.env(['email', 'password']).then(({ email, password }) => {
    if (!email || !password) {
      throw new Error(
        'Faltan las credenciales de la cuenta de pruebas. Copie cypress.env.example.json a ' +
          'cypress.env.json, o exporte CYPRESS_email y CYPRESS_password.',
      )
    }

    return { email: email as string, password: password as string }
  })
}

/**
 * `cy.visit` más un borrado de la base IndexedDB donde Firebase guarda la
 * sesión: el aislamiento entre pruebas limpia cookies y storage, pero no esa,
 * y sin esto una prueba autenticada filtra su sesión a la siguiente.
 *
 * @param role Rol con el que debe arrancar la sesión, para una cuenta que tiene
 * varios. Se deja en `localStorage` antes de que cargue la app, que es de donde
 * la propia app lo lee al restaurar la sesión — el mismo camino que usa un
 * usuario que ya eligió su rol en una visita anterior.
 */
Cypress.Commands.add('visitApp', (path: string, role?: string) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.indexedDB.deleteDatabase('firebaseLocalStorageDb')

      if (role) win.localStorage.setItem('selectedRole', role)
    },
  })
})

const tokenCache = new Map<string, string>()

/** ID token de una cuenta, pedido a Firebase una sola vez por spec y por correo. */
function tokenFor(email: string, password: string): Cypress.Chainable<string> {
  const cached = tokenCache.get(email)
  if (cached) return cy.wrap(cached, { log: false })

  return cy
    .request<{ idToken: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email, password, returnSecureToken: true },
      log: false,
    })
    .then((response) => {
      tokenCache.set(email, response.body.idToken)

      return response.body.idToken
    })
}

/** ID token de la cuenta de pruebas por defecto. */
function apiToken(): Cypress.Chainable<string> {
  return credentials().then(({ email, password }) => tokenFor(email, password))
}

/**
 * Llama a la API real autenticado como la cuenta de pruebas.
 *
 * Es para **preparar y limpiar datos**, no para probar la app: lo que se prueba
 * pasa por la interfaz. Falla la prueba si la API responde error, que es lo que
 * se quiere de un `before` que no pudo dejar el escenario listo.
 */
Cypress.Commands.add('api', (method: string, path: string, body?: unknown) =>
  apiToken().then((token) =>
    cy.request<unknown>({
      method,
      url: apiUrl(path),
      body: body as Cypress.RequestBody,
      headers: { Authorization: `Bearer ${token}` },
    }),
  ),
)

/**
 * Llama a la API real autenticado como una cuenta arbitraria, no la de pruebas
 * por defecto. Para comprobar qué le deja hacer la API a un rol concreto: a
 * diferencia de `cy.api`, no falla ante una respuesta de error — un 403 aquí
 * es a menudo el resultado que la prueba espera, no un contratiempo.
 */
Cypress.Commands.add(
  'apiAs',
  (email: string, password: string, method: string, path: string, body?: unknown) =>
    tokenFor(email, password).then((token) =>
      cy.request<unknown>({
        method,
        url: apiUrl(path),
        body: body as Cypress.RequestBody,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }),
    ),
)

/**
 * Observa las peticiones a la API sin tocarlas: `req.continue()` las deja
 * llegar al backend real y solo las registra bajo el alias `@apiRequest`.
 */
Cypress.Commands.add('watchApi', () => {
  cy.intercept({ url: apiUrl('/**') }, (req) => {
    req.continue()
  }).as('apiRequest')
})

/**
 * Estropea la credencial que sale hacia la API real, dejando que la petición
 * llegue al backend: así el 401 lo emite el backend de verdad, no un stub.
 *
 * @param mode `'expired'` sustituye el token por uno caducado; `'missing'`
 * quita la cabecera `Authorization` por completo.
 */
Cypress.Commands.add('tamperToken', (mode: 'expired' | 'missing') => {
  cy.intercept({ url: apiUrl('/**') }, (req) => {
    if (mode === 'missing') {
      delete req.headers.authorization
    } else {
      req.headers.authorization = `Bearer ${makeExpiredIdToken()}`
    }

    req.continue()
  }).as('apiRequest')
})

/**
 * Rellena y envía el formulario de correo y contraseña. Sin argumentos usa la
 * cuenta de pruebas.
 */
Cypress.Commands.add('loginWithEmail', (email?: string, password?: string) => {
  const account =
    email === undefined && password === undefined
      ? credentials()
      : cy.wrap({ email: email ?? '', password: password ?? '' }, { log: false })

  account.then(({ email: user, password: secret }) => {
    if (user) cy.get('[data-testid="login-email"]').type(user)
    if (secret) cy.get('[data-testid="login-password"]').type(secret, { log: false })

    cy.get('[data-testid="login-submit"]').click()
  })
})

export {}
