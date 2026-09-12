/**
 * RF — Cada endpoint y cada ruta de la aplicación están restringidos por rol,
 * y el menú oculta lo que el rol operado no puede abrir. El filtrado del menú
 * es una comodidad de interfaz; el control efectivo vive en la API.
 *
 * Tres capas, tres formas de probarlo:
 *  1. El menú: con la cuenta de pruebas (tiene los tres roles) cambiando de
 *     rol, igual que en `auth/roles.cy.ts`.
 *  2. Las rutas: con cuentas de un solo rol de verdad, entrando por la
 *     interfaz — a diferencia del menú, una ruta escrita a mano también debe
 *     quedar bloqueada.
 *  3. La API: llamando a los endpoints directamente con el token de esas
 *     mismas cuentas, sin pasar por la interfaz en absoluto. Es la única
 *     forma de comprobar la frase clave del RF — que el control real no está
 *     en lo que la interfaz decide mostrar.
 *
 * La última prueba conecta las tres: fuerza el rol operado en el navegador a
 * uno que la cuenta no tiene y comprueba que eso engaña al menú y a la ruta,
 * pero no a la API.
 */

const marca = `e2e-rbac-${Date.now()}`

interface RoleAccount {
  uid: string
  email: string
  password: string
}

/**
 * Crea, por API, una cuenta real de Firebase con un único rol: signUp en
 * Firebase y alta en el backend con `roles: [role]`, nada más. No hay endpoint
 * de borrado, así que `after` la deja inactiva.
 */
function createRoleAccount(role: string, label: string, departmentId: number) {
  const email = `${marca}-${label}@ufps.edu.co`
  const password = 'Prueba-e2e-1!'

  return cy
    .request<{ localId: string }>({
      method: 'POST',
      url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${Cypress.expose('firebaseApiKey')}`,
      body: { email, password, returnSecureToken: true },
    })
    .then((signUp) => {
      const uid = signUp.body.localId

      return cy
        .api('POST', '/users/', {
          uid,
          email,
          name: `Cuenta de prueba — ${role}`,
          active: true,
          avatar_url: '',
          institutional_code: `${marca}-${label}`,
          contract_type: 'Tiempo completo',
          department_id: departmentId,
          roles: [role],
        })
        .then((): RoleAccount => ({ uid, email, password }))
    })
}

let docente: RoleAccount
let director: RoleAccount

before(() => {
  cy.api('GET', '/departments/?page=1&limit=1').then((response) => {
    const [department] = (response.body as { data: Array<{ id: number }> }).data

    createRoleAccount('DOCENTE', 'docente', department.id).then((account) => {
      docente = account
    })
    createRoleAccount('DIRECTOR DE DEPARTAMENTO', 'director', department.id).then((account) => {
      director = account
    })
  })
})

after(() => {
  cy.api('PATCH', `/users/${docente.uid}/status`, { active: false })
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Menú: solo lo que el rol operado puede abrir (comodidad de interfaz)', () => {
  const casos: Array<{ role: string; visibles: string[]; ocultos: string[] }> = [
    {
      role: 'ADMIN',
      visibles: ['Facultades', 'Usuarios', 'Directores', 'Configuración', 'Historial'],
      ocultos: ['Evaluaciones', 'Docentes', 'Comentarios', 'Alertas', 'Acciones sugeridas'],
    },
    {
      role: 'DOCENTE',
      visibles: ['Periodos', 'Materias', 'Planes de mejoramiento'],
      ocultos: [
        'Facultades',
        'Usuarios',
        'Directores',
        'Configuración',
        'Historial',
        'Evaluaciones',
      ],
    },
    {
      role: 'DIRECTOR DE DEPARTAMENTO',
      visibles: ['Evaluaciones', 'Docentes', 'Comentarios', 'Alertas', 'Acciones sugeridas'],
      ocultos: ['Facultades', 'Usuarios', 'Directores', 'Configuración', 'Historial'],
    },
  ]

  casos.forEach(({ role, visibles, ocultos }) => {
    it(`como ${role}, el menú lateral muestra lo suyo y esconde lo demás`, () => {
      cy.visitApp('/home', role)
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/home')

      cy.get('[data-slot="sidebar-menu"]')
        .invoke('text')
        .then((texto) => {
          visibles.forEach((label) => expect(texto, `debería mostrar "${label}"`).to.include(label))
          ocultos.forEach((label) =>
            expect(texto, `no debería mostrar "${label}"`).to.not.include(label),
          )
        })
    })
  })
})

describe('Rutas: bloqueadas para quien no tiene el rol, aunque las escriba a mano', () => {
  it('un docente no puede abrir una ruta exclusiva de administrador', () => {
    cy.visitApp('/login')
    cy.loginWithEmail(docente.email, docente.password)
    cy.location('pathname').should('eq', '/home')

    cy.visit('/admin/usuarios')

    cy.contains('Acceso no autorizado', { timeout: 10000 }).should('be.visible')
    cy.contains('Crear usuario').should('not.exist')
  })

  it('un docente no puede abrir una ruta exclusiva de director', () => {
    cy.visitApp('/login')
    cy.loginWithEmail(docente.email, docente.password)
    cy.location('pathname').should('eq', '/home')

    cy.visit('/evaluaciones')

    cy.contains('Acceso no autorizado', { timeout: 10000 }).should('be.visible')
    cy.contains('Cargar evaluación').should('not.exist')
  })

  it('un director no puede abrir una ruta exclusiva de administrador', () => {
    cy.visitApp('/login')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/home')

    cy.visit('/admin/usuarios')

    cy.contains('Acceso no autorizado', { timeout: 10000 }).should('be.visible')
    cy.contains('Crear usuario').should('not.exist')
  })

  it('un docente sí puede abrir las rutas que le corresponden', () => {
    cy.visitApp('/login')
    cy.loginWithEmail(docente.email, docente.password)
    cy.location('pathname').should('eq', '/home')

    cy.visit('/periodos')

    cy.contains('Acceso no autorizado').should('not.exist')
    cy.contains('h1', 'Mis periodos').should('be.visible')
  })
})

describe('API: el control real no depende de la interfaz', () => {
  const soloAdmin = [
    '/users/?page=1&limit=1',
    '/departments/?page=1&limit=1',
    '/faculties/?page=1&limit=1',
    '/programs/?page=1&limit=1',
    '/directors/?page=1&limit=1',
    '/settings/?page=1&limit=1',
    '/audits/?page=1&limit=1',
  ]

  soloAdmin.forEach((path) => {
    it(`rechaza a un docente y a un director en ${path}`, () => {
      cy.apiAs(docente.email, docente.password, 'GET', path).its('status').should('eq', 403)
      cy.apiAs(director.email, director.password, 'GET', path).its('status').should('eq', 403)
    })
  })

  it('deja listar docentes a un director, pero no a un docente', () => {
    cy.apiAs(docente.email, docente.password, 'GET', '/teachers/?page=1&limit=1')
      .its('status')
      .should('eq', 403)

    cy.apiAs(director.email, director.password, 'GET', '/teachers/?page=1&limit=1')
      .its('status')
      .should('eq', 200)
  })

  it('deja listar comentarios a un director, pero no a un docente', () => {
    cy.apiAs(docente.email, docente.password, 'GET', '/comments/?page=1&limit=1')
      .its('status')
      .should('eq', 403)

    cy.apiAs(director.email, director.password, 'GET', '/comments/?page=1&limit=1')
      .its('status')
      .should('eq', 200)
  })

  it('deja pasar a ambos por los endpoints comunes a cualquier cuenta autenticada', () => {
    ;['/users/auth', '/academic-periods/?page=1&limit=1'].forEach((path) => {
      cy.apiAs(docente.email, docente.password, 'GET', path).its('status').should('eq', 200)
      cy.apiAs(director.email, director.password, 'GET', path).its('status').should('eq', 200)
    })
  })
})

describe('El menú y la ruta se pueden falsear; la API no', () => {
  it('un docente que se pone ADMIN a mano ve el menú y la página, pero nunca los datos', () => {
    cy.visitApp('/login')
    cy.loginWithEmail(docente.email, docente.password)
    cy.location('pathname').should('eq', '/home')

    // La app restaura el rol guardado sin comprobar que la cuenta lo tenga —
    // exactamente el punto del RF: esto es "comodidad de interfaz", no una
    // barrera. Un docente de verdad no tiene forma de hacer esto desde el
    // menú, pero cualquiera puede escribirlo en la consola del navegador.
    cy.window().its('localStorage').invoke('setItem', 'selectedRole', 'ADMIN')
    cy.reload()

    // El menú, engañado, ofrece rutas de administrador...
    cy.get('[data-slot="sidebar-menu"]').should('contain.text', 'Usuarios')

    // ...y la ruta, engañada igual, deja de bloquear la página. El alias se
    // arma justo antes de navegar y apunta solo al listado (no a `/users/auth`
    // ni a `/users/{uid}/...`), para no confundirlo con una petición anterior.
    cy.intercept({ method: 'GET', url: /\/users\/(\?|$)/ }).as('usersList')
    cy.visit('/admin/usuarios')
    cy.contains('Acceso no autorizado').should('not.exist')
    cy.contains('h1', 'Usuarios').should('be.visible')

    // Pero la petición que la página dispara sale con el token real de este
    // docente, y la API la rechaza — el dato nunca llega, con o sin disfraz.
    cy.wait('@usersList').its('response.statusCode').should('eq', 403)
    cy.contains('permission').should('be.visible')
    cy.contains('No hay usuarios que coincidan.').should('be.visible')
  })
})
