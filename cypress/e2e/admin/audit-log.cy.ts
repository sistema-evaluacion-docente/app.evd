/**
 * RF — Toda mutación debe registrar un evento de auditoría con el usuario
 * responsable y con una descripción legible.
 *
 * Las facultades son la mutación representativa: `POST/PUT/DELETE /faculties/`
 * tienen borrado real (cada prueba deja su facultad limpia) y `FacultyService`
 * registra `CREATE/UPDATE/DELETE` en español con el `id` de quien llama
 * (`current_user.get("id")`, verificado contra el servidor real antes de
 * escribir este spec). Lo que el RF pide —crear, editar, borrar— pasa por la
 * interfaz, como en `admin/faculties.cy.ts`; el evento resultante se comprueba
 * por API (`GET /audits/`, que no tiene pantalla propia de alta) y la
 * legibilidad final en `/admin/historial`, que es donde un admin lo lee.
 *
 * `GET /audits/` no expone borrado: las facultades se eliminan, pero sus
 * eventos quedan para siempre — que es justo lo que el RF quiere. Cada
 * ejecución deja cuatro eventos con el prefijo `e2e-auditoria-`.
 */

const marca = `e2e-auditoria-${Date.now()}`

interface AuditActor {
  id: number
  name: string | null
  email: string | null
}

interface AuditEntry {
  id: number
  user_id: number | null
  user: AuditActor | null
  table_name: string | null
  operation: string | null
  element: string | null
  description: string | null
}

interface Faculty {
  id: number
  name: string
  code: string
}

let actorId: number
let actorEmail: string
let actorName: string

before(() => {
  cy.api('GET', '/users/auth').then((response) => {
    const me = (response.body as { data: { id: number; email: string; name: string } }).data

    actorId = me.id
    actorEmail = me.email
    actorName = me.name
  })
})

/** Crea una facultad desechable por API, con nombre y código únicos. */
function createFaculty(label: string) {
  const code = `${marca}-${label}`

  return cy
    .api('POST', '/faculties/', { name: `Facultad de prueba ${code}`, code })
    .then((response) => (response.body as { data: Faculty }).data)
}

/**
 * Busca el evento de una mutación: misma entidad (`faculties`), misma
 * operación y el código único de la prueba en elemento o descripción.
 */
function findAudit(code: string, operation: string) {
  return cy
    .api('GET', `/audits/?search=${code}&entity_name=faculties&operation=${operation}&limit=10`)
    .then((response) => (response.body as { data: AuditEntry[] }).data)
}

/** Lo común a todo evento: quién lo hizo y una descripción que lo cuenta. */
function expectAuditTrail(entry: AuditEntry, code: string) {
  expect(entry.user_id, 'el evento indica quién lo hizo').to.eq(actorId)
  expect(entry.user?.email, 'el evento trae el correo del responsable').to.eq(actorEmail)
  expect(entry.description, 'el evento trae una descripción').to.be.a('string').and.not.eq('')
  expect(entry.description, 'la descripción menciona qué cambió').to.include(code)
}

/** Busca en la tabla de facultades, por código, y devuelve su fila. */
function findFaculty(code: string) {
  cy.get('input[placeholder="Buscar por nombre o código..."]').clear().type(code)

  return cy.contains('tr', code, { timeout: 15000 })
}

/** Borra por API la facultad que una prueba ya no necesita. */
function deleteFaculty(id: number) {
  cy.api('DELETE', `/faculties/${id}`)
}

describe('Toda mutación deja un evento de auditoría con responsable y descripción', () => {
  it('registra quién creó la facultad y con qué descripción', () => {
    const code = `${marca}-crear`
    const name = `Facultad creada ${code}`

    cy.visitApp('/admin/facultades', 'ADMIN')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/admin/facultades')

    cy.contains('button', 'Crear facultad').click()
    cy.get('#name').type(name)
    cy.get('#code').type(code)
    cy.contains('button', /^Crear$/).click()
    cy.contains('Facultad creada exitosamente').should('be.visible')

    findAudit(code, 'CREATE').then((entries) => {
      expect(entries, 'crear deja un solo evento').to.have.length(1)

      const [entry] = entries

      expect(entry.table_name).to.eq('faculties')
      expect(entry.operation).to.eq('CREATE')
      expectAuditTrail(entry, code)
      expect(entry.description, 'la descripción nombra la facultad y su código').to.include(name)
    })

    cy.api('GET', `/faculties/?search=${code}&limit=1`).then((response) => {
      const [creada] = (response.body as { data: Array<{ id: number }> }).data

      deleteFaculty(creada.id)
    })
  })

  it('registra quién actualizó la facultad y qué cambió', () => {
    createFaculty('editar').then((facultad) => {
      const nuevoNombre = `Facultad editada ${facultad.code}`

      cy.visitApp('/admin/facultades', 'ADMIN')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/admin/facultades')

      findFaculty(facultad.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Editar').click()
      cy.contains('Editar facultad').should('be.visible')
      cy.get('#name').clear().type(nuevoNombre)
      cy.contains('button', /^Guardar$/).click()
      cy.contains('Facultad actualizada exitosamente').should('be.visible')

      findAudit(facultad.code, 'UPDATE').then((entries) => {
        expect(entries, 'actualizar deja un solo evento').to.have.length(1)
        expectAuditTrail(entries[0], facultad.code)
        expect(entries[0].description, 'la descripción cuenta qué cambió').to.include(nuevoNombre)
      })

      deleteFaculty(facultad.id)
    })
  })

  it('registra quién eliminó la facultad, y el evento sobrevive al borrado', () => {
    createFaculty('eliminar').then((facultad) => {
      cy.visitApp('/admin/facultades', 'ADMIN')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/admin/facultades')

      findFaculty(facultad.code).find('button[aria-label="Acciones"]').click()
      cy.contains('Eliminar').click()
      cy.contains('Eliminar facultad').should('be.visible')
      cy.contains('button', /^Eliminar$/).click()
      cy.contains('Facultad eliminada exitosamente').should('be.visible')

      cy.api('GET', `/faculties/?search=${facultad.code}&limit=1`).then((response) => {
        expect(
          (response.body as { data: unknown[] }).data,
          'la facultad ya no existe',
        ).to.have.length(0)
      })

      findAudit(facultad.code, 'DELETE').then((entries) => {
        expect(entries, 'el borrado deja su evento aunque el recurso ya no exista').to.have.length(
          1,
        )
        expectAuditTrail(entries[0], facultad.code)
        expect(entries[0].description, 'la descripción nombra lo que se borró').to.include(
          facultad.name,
        )
      })
    })
  })

  it('el historial muestra el evento con su responsable y su descripción', () => {
    createFaculty('historial').then((facultad) => {
      findAudit(facultad.code, 'CREATE').then((entries) => {
        const [entry] = entries
        const description = entry.description ?? ''

        expect(description, 'hay una descripción que mostrar').to.not.eq('')

        cy.visitApp('/admin/historial', 'ADMIN')
        cy.loginWithEmail()
        cy.location('pathname').should('eq', '/admin/historial')

        cy.get('input[placeholder="Buscar por elemento o descripción..."]')
          .clear()
          .type(facultad.code)

        // El código solo existe en elemento/descripción, que no son columnas:
        // la búsqueda filtra en el servidor hasta dejar esta única fila.
        cy.get('tbody tr', { timeout: 15000 }).should('have.length', 1)

        const row = cy.contains('tr', actorName)

        row.within(() => {
          cy.contains(actorEmail).should('be.visible')
          cy.contains('Facultades').should('be.visible')
          cy.contains('Crear').should('be.visible')
        })

        row.find('button[aria-label="Acciones"]').click()
        cy.contains('Ver detalle').click()

        cy.contains(`Registro de auditoría #${entry.id}`).should('be.visible')
        cy.contains(description).should('be.visible')
      })

      deleteFaculty(facultad.id)
    })
  })
})
