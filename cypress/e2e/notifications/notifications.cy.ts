/**
 * RF-7.1 (Alta) — Consulta de notificaciones, conteo de no leídas y marcado
 * individual y completo.
 *
 * Corre contra la pila real. La cuenta de pruebas puede crear notificaciones
 * para sí misma vía `POST /notifications/` (permitido a DIRECTOR DE
 * DEPARTAMENTO y ADMIN, dos de sus roles) — cada prueba parte marcando todo
 * como leído (`PUT /notifications/me/read-all`) y luego siembra sus propias
 * notificaciones de verdad, así que el conteo de no leídas es exacto y
 * determinista sin depender de lo que otras pruebas, u otras corridas, u el
 * procesamiento de evaluaciones sembradas en otros specs vayan dejando en la
 * bandeja.
 */

const marca = `${Date.now()}`

interface SeedNotificationOverrides {
  title?: string
  message?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  link?: string
}

function seedNotification(userId: number, overrides: SeedNotificationOverrides = {}) {
  return cy.api('POST', '/notifications/', {
    user_id: userId,
    title: 'Notificación de prueba',
    message: 'Mensaje de prueba generado por Cypress',
    type: 'info',
    ...overrides,
  })
}

/**
 * Contenedor de una fila de notificación completa — misma clase real en la
 * campana y en la página. `NotificationItem` envuelve el título/mensaje en
 * un `<div className="flex ... gap-3">` interno (cuando la notificación no
 * trae `link`, que es el caso de todas las de prueba) que también matchea
 * `.flex.gap-3` — así que hace falta una clase extra (`p-4`, solo en la fila
 * exterior) para no quedarse en el envoltorio interno, que no incluye el
 * botón de "Marcar como leída".
 */
function notificationRow(title: string) {
  return cy.contains(title).closest('div.flex.gap-3.p-4')
}

let userId: number

before(() => {
  cy.api('GET', '/users/auth').then((response) => {
    userId = (response.body as { data: { id: number } }).data.id
  })
})

describe('Notificaciones', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.api('PUT', '/notifications/me/read-all')
  })

  describe('campana de notificaciones', () => {
    beforeEach(() => {
      cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/home')
    })

    it('muestra en el badge el conteo real de no leídas', () => {
      seedNotification(userId, { title: `Alerta de prueba uno ${marca}` })
      seedNotification(userId, { title: `Alerta de prueba dos ${marca}` })

      cy.reload()

      // Primera carga de la corrida de este spec: árbol del layout en frío.
      cy.get('[aria-label="Notificaciones"]', { timeout: 20000 }).should('contain.text', '2')
    })

    it('lista las notificaciones reales, con su título y mensaje', () => {
      seedNotification(userId, {
        title: `Notificación campana X ${marca}`,
        message: 'Contenido real de la campana X',
      })

      cy.reload()

      cy.get('[aria-label="Notificaciones"]').click()
      cy.contains(`Notificación campana X ${marca}`).should('be.visible')
      cy.contains('Contenido real de la campana X').should('be.visible')
    })

    it('marca una notificación individual como leída y descuenta el badge', () => {
      seedNotification(userId, { title: `Marcar individual ${marca}` })
      seedNotification(userId, { title: `Se queda sin leer ${marca}` })

      cy.reload()

      cy.get('[aria-label="Notificaciones"]').should('contain.text', '2').click()
      notificationRow(`Marcar individual ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .click()

      // Solo bajó la que se marcó — la otra sigue contando como no leída.
      cy.get('[aria-label="Notificaciones"]').should('contain.text', '1')
      notificationRow(`Marcar individual ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .should('not.exist')
      notificationRow(`Se queda sin leer ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .should('exist')
    })

    it('marca todas las notificaciones como leídas de una vez', () => {
      seedNotification(userId, { title: `Masiva uno ${marca}` })
      seedNotification(userId, { title: `Masiva dos ${marca}` })

      cy.reload()

      cy.get('[aria-label="Notificaciones"]').should('contain.text', '2').click()
      cy.contains('button', 'Marcar todas como leídas').click()

      cy.get('[aria-label="Notificaciones"]').invoke('text').should('eq', '')
      cy.contains('button', 'Marcar todas como leídas').should('not.exist')
    })
  })

  describe('página completa de notificaciones', () => {
    beforeEach(() => {
      cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/home')
    })

    it('busca notificaciones por texto contra la API real', () => {
      seedNotification(userId, { title: `Recordatorio único de búsqueda ${marca}`, message: 'x' })
      seedNotification(userId, { title: `Otra notificación distinta ${marca}`, message: 'y' })

      cy.visit('/notificaciones')
      cy.contains(`Recordatorio único de búsqueda ${marca}`, { timeout: 20000 }).should(
        'be.visible',
      )

      cy.get('[aria-label="Buscar en las notificaciones"]').type('único de búsqueda')

      cy.contains(`Recordatorio único de búsqueda ${marca}`).should('be.visible')
      cy.contains(`Otra notificación distinta ${marca}`).should('not.exist')
    })

    it('filtra por tipo', () => {
      seedNotification(userId, { title: `Tipo advertencia ${marca}`, type: 'warning' })
      seedNotification(userId, { title: `Tipo informativo ${marca}`, type: 'info' })

      cy.visit('/notificaciones')
      cy.contains(`Tipo advertencia ${marca}`, { timeout: 20000 }).should('be.visible')

      cy.contains('button', 'Filtros').click()
      cy.contains('label', 'Tipo').parent().find('[data-slot="select-trigger"]').click()
      cy.contains('[data-slot="select-item"]:visible', 'Advertencia').click()

      cy.contains(`Tipo advertencia ${marca}`).should('be.visible')
      cy.contains(`Tipo informativo ${marca}`).should('not.exist')
    })

    it('filtra por estado de lectura', () => {
      seedNotification(userId, { title: `Sigue sin leer ${marca}` })

      cy.visit('/notificaciones')
      cy.contains(`Sigue sin leer ${marca}`, { timeout: 20000 }).should('be.visible')

      notificationRow(`Sigue sin leer ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .click()

      cy.contains('button', 'Filtros').click()
      cy.contains('label', 'Estado').parent().find('[data-slot="select-trigger"]').click()
      cy.contains('[data-slot="select-item"]:visible', 'No leídas').click()

      cy.contains(`Sigue sin leer ${marca}`).should('not.exist')

      // El popover de "Filtros" se queda abierto tras elegir una opción — un
      // segundo clic sobre "Filtros" lo cerraría en vez de reabrirlo.
      cy.contains('label', 'Estado').parent().find('[data-slot="select-trigger"]').click()
      cy.contains('[data-slot="select-item"]:visible', 'Leídas').click()

      cy.contains(`Sigue sin leer ${marca}`).should('be.visible')
    })

    it('marca una notificación como leída desde la página completa', () => {
      seedNotification(userId, { title: `Leer desde la página ${marca}` })

      cy.visit('/notificaciones')
      cy.contains(`Leer desde la página ${marca}`, { timeout: 20000 }).should('be.visible')

      notificationRow(`Leer desde la página ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .click()

      notificationRow(`Leer desde la página ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .should('not.exist')
    })

    it('marca todas como leídas desde el encabezado de la página', () => {
      seedNotification(userId, { title: `Encabezado uno ${marca}` })
      seedNotification(userId, { title: `Encabezado dos ${marca}` })

      cy.visit('/notificaciones')
      cy.contains(`Encabezado uno ${marca}`, { timeout: 20000 }).should('be.visible')

      // El botón del encabezado depende del store de la campana (su propio
      // fetch, aparte de la lista paginada de la página) — puede tardar un
      // poco más en aparecer que el listado mismo.
      cy.contains('button', 'Marcar todas como leídas', { timeout: 20000 }).click()

      notificationRow(`Encabezado uno ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .should('not.exist')
      notificationRow(`Encabezado dos ${marca}`)
        .find('button[aria-label="Marcar como leída"]')
        .should('not.exist')
      cy.contains('button', 'Marcar todas como leídas').should('not.exist')
    })
  })
})
