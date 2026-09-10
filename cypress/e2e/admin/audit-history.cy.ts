/**
 * RF — El administrador debe poder consultar el historial de auditoría de forma
 * paginada y por identificador.
 *
 * `GET /audits/` pagina en el servidor (`page`/`limit`, ordenado por fecha
 * descendente, con `total`/`pages` en la respuesta) y `GET /audits/{id}`
 * devuelve un registro o `404` — verificado contra el servidor real antes de
 * escribir este spec. La aritmética de páginas se comprueba por API; el
 * paginador de `/admin/historial` (el `DataTable` compartido: "Filas por
 * página", "Página X de Y") y el detalle por identificador, por la interfaz.
 *
 * El fixture son seis facultades creadas por API (seis eventos `CREATE` con el
 * mismo prefijo, buscables juntos): seis porque el tamaño de página mínimo que
 * ofrece la interfaz es 5, y hacen falta más de cinco para que haya dos
 * páginas de verdad. Cada prueba limpia sus facultades; los eventos, como en
 * `admin/audit-log.cy.ts`, no se pueden borrar (`GET /audits/` no expone
 * borrado) y quedan con el prefijo `e2e-historial-`.
 */

const marca = `e2e-historial-${Date.now()}`
const COUNT = 6

interface AuditEntry {
  id: number
  user_id: number | null
  user: { id: number; name: string | null; email: string | null } | null
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

interface AuditPage {
  data: AuditEntry[]
  pagination: { total: number; page: number; limit: number; pages: number } | null
}

const facultyIds: number[] = []

before(() => {
  for (let n = 1; n <= COUNT; n += 1) {
    const code = `${marca}-h${n}`

    cy.api('POST', '/faculties/', { name: `Facultad de prueba ${code}`, code }).then((response) => {
      facultyIds.push((response.body as { data: Faculty }).data.id)
    })
  }
})

after(() => {
  cy.wrap(facultyIds).each((id: number) => {
    cy.api('DELETE', `/faculties/${id}`)
  })
})

/** Lista los eventos del fixture con los parámetros de paginación dados. */
function listAudits(query: string) {
  return cy
    .api('GET', `/audits/?search=${marca}${query}`)
    .then((response) => response.body as AuditPage)
}

describe('Historial de auditoría paginado y por identificador', () => {
  it('pagina el listado sin perder ni repetir registros', () => {
    listAudits('&limit=100').then((full) => {
      expect(full.pagination?.total, 'hay un evento por facultad').to.eq(COUNT)

      const allIds = full.data.map((entry) => entry.id)

      listAudits('&limit=2&page=1').then((page1) => {
        expect(page1.pagination?.pages, 'seis eventos de dos en dos dan tres páginas').to.eq(3)
        expect(page1.data.map((entry) => entry.id)).to.have.length(2)

        listAudits('&limit=2&page=2').then((page2) => {
          listAudits('&limit=2&page=3').then((page3) => {
            const paged = [...page1.data, ...page2.data, ...page3.data].map((entry) => entry.id)

            expect(new Set(paged).size, 'ninguna página repite registros').to.eq(COUNT)
            expect([...paged].sort((a, b) => a - b)).to.deep.eq([...allIds].sort((a, b) => a - b))
          })
        })
      })
    })
  })

  it('devuelve un registro por su identificador, o 404 si no existe', () => {
    listAudits('&limit=100').then((full) => {
      const [target] = full.data

      cy.api('GET', `/audits/${target.id}`).then((response) => {
        const got = (response.body as { data: AuditEntry }).data

        expect(got.id).to.eq(target.id)
        expect(got.operation).to.eq('CREATE')
        expect(got.element).to.eq(target.element)
        expect(got.description).to.eq(target.description)
        expect(got.user?.id).to.eq(target.user_id)
      })
    })

    cy.env(['email', 'password']).then(({ email, password }) => {
      cy.apiAs(email, password, 'GET', '/audits/99999999').its('status').should('eq', 404)
    })
  })

  it('la interfaz pagina el historial y abre el detalle por identificador', () => {
    listAudits('&limit=100').then((full) => {
      const oldest = full.data[full.data.length - 1]
      const description = oldest.description ?? ''

      expect(description, 'hay una descripción que mostrar').to.not.eq('')

      cy.visitApp('/admin/historial', 'ADMIN')
      cy.loginWithEmail()
      cy.location('pathname').should('eq', '/admin/historial')

      cy.get('input[placeholder="Buscar por elemento o descripción..."]').clear().type(marca)

      cy.get('tbody tr', { timeout: 15000 }).should('have.length', COUNT)
      cy.contains('Página 1 de 1').should('be.visible')

      cy.contains('button', '10').click()
      cy.get('[role="menuitem"]').contains('5').click()

      cy.contains('Página 1 de 2').should('be.visible')
      cy.get('tbody tr').should('have.length', 5)

      cy.get('button[aria-label="Página siguiente"]').click()

      // La última página trae un solo evento: el más antiguo, el mismo que la
      // API lista en último lugar porque ambas vías ordenan por fecha.
      cy.contains('Página 2 de 2').should('be.visible')
      cy.get('tbody tr').should('have.length', 1)

      cy.get('tbody tr').first().find('button[aria-label="Acciones"]').click()
      cy.contains('Ver detalle').click()

      cy.contains(`Registro de auditoría #${oldest.id}`).should('be.visible')
      cy.contains(description).should('be.visible')
    })
  })
})
