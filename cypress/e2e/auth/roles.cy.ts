/**
 * RF — Un usuario con varios roles elige con cuál opera, y esa elección
 * persiste en el navegador.
 *
 * La cuenta de pruebas tiene que tener **al menos dos roles**: sin eso no hay
 * nada que elegir y la primera prueba falla con un mensaje que lo dice.
 */

/** El menú del avatar, abierto desde cero. */
function openUserMenu() {
  cy.get('[data-testid="user-menu"]').should('have.attr', 'aria-expanded', 'false').click()

  return cy.get('[data-slot="dropdown-menu-content"]').should('be.visible')
}

/** Abre el selector de rol y devuelve sus opciones. */
function openRoleSwitcher() {
  openUserMenu()
  cy.contains('Cambiar de rol').click()

  return cy.get('[data-slot="dropdown-menu-radio-item"]')
}

/**
 * Cierra el menú y espera a que lo esté de verdad. Hace falta un Escape para el
 * submenú de roles y otro para el menú que lo contiene; el segundo se manda solo
 * si el primero no bastó.
 */
function closeMenu() {
  cy.focused().type('{esc}')

  cy.get('[data-testid="user-menu"]').then(($trigger) => {
    if ($trigger.attr('aria-expanded') === 'true') {
      cy.focused().type('{esc}')
    }
  })

  cy.get('[data-testid="user-menu"]').should('have.attr', 'aria-expanded', 'false')
}

/**
 * Elige el primer rol distinto del activo y devuelve su nombre. Elegir no
 * cierra el menú —es un grupo de radio, no una acción— así que lo cierra.
 */
function selectOtherRole() {
  return openRoleSwitcher()
    .filter('[aria-checked="false"]')
    .first()
    .then(($option) => {
      const rol = $option.text().trim()

      cy.wrap($option).click()
      closeMenu()

      return cy.wrap(rol)
    })
}

/** El rol que la cabecera muestra como activo. */
function visibleRole() {
  return cy.get('[data-testid="user-menu"]').parent().find('span').first()
}

/**
 * Lo que queda guardado en el navegador para la próxima visita. Es una consulta
 * que se reintenta, así que léela siempre dentro de la aserción — nunca la
 * guardes en un alias: `cy.get('@alias')` volvería a ejecutarla y devolvería el
 * valor de ahora, no el de antes.
 */
function storedRole() {
  return cy.window().its('localStorage').invoke('getItem', 'selectedRole')
}

describe('Selección de rol', () => {
  beforeEach(() => {
    cy.visitApp('/login')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  it('ofrece los roles del usuario y marca el que está operando', () => {
    openRoleSwitcher().should(($options) => {
      expect(
        $options.length,
        'roles de la cuenta de pruebas — necesita al menos dos',
      ).to.be.at.least(2)
    })

    cy.get('[data-slot="dropdown-menu-radio-item"][aria-checked="true"]').should('have.length', 1)

    // Lo marcado en el menú es lo que está guardado en el navegador.
    storedRole().should('not.be.null')
  })

  it('cambia de rol, y con él lo que el usuario puede hacer', () => {
    cy.get('[data-slot="sidebar-menu"]')
      .invoke('text')
      .then((menuInicial) => {
        storedRole().then((rolInicial) => {
          selectOtherRole().then((rolNuevo) => {
            visibleRole().should('have.text', rolNuevo)
            cy.location('pathname').should('eq', '/home')
          })

          // El rol elegido reemplaza al anterior en el navegador...
          storedRole().should('not.eq', rolInicial).and('not.be.null')

          // ...y el menú lateral pasa a ser el del rol nuevo.
          cy.get('[data-slot="sidebar-menu"]').invoke('text').should('not.eq', menuInicial)
        })
      })
  })

  it('mantiene el rol elegido al recargar y al volver a entrar a la app', () => {
    selectOtherRole().then((rolElegido) => {
      storedRole().then((guardado) => {
        cy.reload()

        visibleRole().should('have.text', rolElegido)
        storedRole().should('eq', guardado)

        // Volver a entrar a la app, no solo recargar la misma vista.
        cy.visit('/notificaciones')

        visibleRole().should('have.text', rolElegido)
        storedRole().should('eq', guardado)
      })
    })
  })

  it('sin nada guardado arranca en el primer rol de la cuenta', () => {
    visibleRole()
      .invoke('text')
      .then((rolPorDefecto) => {
        selectOtherRole()
        visibleRole().should('not.have.text', rolPorDefecto)

        // Un navegador limpio: la app vuelve a decidir desde cero.
        cy.clearLocalStorage()
        cy.reload()

        visibleRole().should('have.text', rolPorDefecto)
      })
  })

  it('no cambia nada si se cierra el menú sin elegir otro rol', () => {
    storedRole().then((guardado) => {
      openRoleSwitcher().should('have.length.at.least', 2)
      closeMenu()

      storedRole().should('eq', guardado)
      cy.location('pathname').should('eq', '/home')
    })
  })

  it('olvida el rol elegido al cerrar sesión', () => {
    selectOtherRole()
    storedRole().should('not.be.null')

    openUserMenu()
    cy.contains('Cerrar sesión').click()

    cy.location('pathname').should('eq', '/login')
    storedRole().should('be.null')
  })
})
