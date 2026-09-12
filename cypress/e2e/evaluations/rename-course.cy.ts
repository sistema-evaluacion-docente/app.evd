/**
 * RF — El sistema debe permitir renombrar una materia conservando su código,
 * para preservar el histórico y las comparaciones entre periodos.
 *
 * La única pantalla que implementa esto es `EvaluationCoursesReview`
 * (`/evaluaciones/:id/materias`, botón "Revisar materias" tras subir una
 * evaluación): lista las materias que la extracción del PDF produjo y deja
 * editar el nombre en línea; el código, al lado, es de solo lectura. Como en
 * `academic-groups.cy.ts`, los cursos no tienen pantalla de alta propia — solo
 * existen a partir de un PDF real procesado — así que el fixture es el mismo
 * de `upload.cy.ts`: `cypress/files/2025-1.pdf` contra el departamento de
 * código fijo `99` ("Testing"), con las materias que trae grabadas
 * ("SISTEMAS OPERATIVOS", código `1155604`, entre otras). El código no puede
 * aleatorizarse con `marca` por venir impreso en el PDF.
 *
 * Al verificar el RF contra el servidor real apareció un bug: `useUpdateCourse`
 * llamaba a `PUT /courses/{id}`, restringido a ADMIN en la API — pero las dos
 * pantallas que lo usan (esta y `/materias`) están restringidas a
 * `DIRECTOR DE DEPARTAMENTO` en `security.ts`. Un director real que no fuera
 * también ADMIN (el caso normal) recibía 403 y no podía renombrar nada. Se
 * corrigió en `app.evd` (no hacía falta tocar `api.evd`): ahora llama a
 * `PATCH /courses/{id}/name`, ya restringido al director y a su propio
 * departamento. Por eso esta prueba usa una cuenta de un solo rol
 * (`DIRECTOR DE DEPARTAMENTO`, creada de cero) en vez de la cuenta compartida
 * multirol — con ADMIN de por medio el bug habría quedado invisible.
 *
 * El curso no se puede borrar (tiene grupos académicos asociados, y
 * `DELETE /courses/{id}` lo rechaza en ese caso), así que el nombre original
 * se restaura al terminar para no dejar el fixture compartido con un nombre
 * de prueba. Lo que sí se limpia del todo es la evaluación que crea esta
 * prueba (con el token del propio director, como en `upload.cy.ts`) y la
 * cuenta de director.
 */

const marca = `e2e-renombrar-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const COURSE_CODE = '1155604'

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

/** Busca el departamento de código `99` que exige el PDF; lo crea si nadie lo
 * ha hecho todavía (igual que `upload.cy.ts`, que necesita el mismo fixture). */
function findOrCreateFixtureDepartment(): Cypress.Chainable<{ id: number; hasDirector: boolean }> {
  return cy.api('GET', '/departments/?search=99&limit=10').then((response) => {
    const departments = (
      response.body as { data: Array<{ id: number; code: string; director: unknown }> }
    ).data
    const existing = departments.find((department) => department.code === '99')

    if (existing) return cy.wrap({ id: existing.id, hasDirector: existing.director !== null })

    return cy.api('GET', '/faculties/?limit=1').then((facultyResponse) => {
      const [faculty] = (facultyResponse.body as { data: Array<{ id: number }> }).data

      return cy
        .api('POST', '/departments/', { name: 'Testing', code: '99', faculty_id: faculty.id })
        .then((created) => ({
          id: (created.body as { data: { id: number } }).data.id,
          hasDirector: false,
        }))
    })
  })
}

/** Crea, por API, una cuenta real de Firebase con un único rol
 * (`DIRECTOR DE DEPARTAMENTO`) — no la cuenta compartida multirol, que
 * enmascararía el bug de permisos que este RF destapó (ver cabecera). */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}-director@ufps.edu.co`
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
          name: `Director de prueba ${marca}`,
          active: true,
          avatar_url: '',
          institutional_code: marca,
          contract_type: 'Tiempo completo',
          roles: ['DIRECTOR DE DEPARTAMENTO'],
        })
        .then((response) => {
          const id = (response.body as { data: { id: number } }).data.id

          return { uid, email, password, id }
        })
    })
}

/** `cy.apiAs` con las credenciales de la directora que crea esta prueba, para
 * las rutas de `/courses/` — restringidas al departamento de quien pregunta. */
function apiAsDirector(
  method: string,
  path: string,
  body?: unknown,
): Cypress.Chainable<Cypress.Response<unknown>> {
  return cy.apiAs(director.email, director.password, method, path, body)
}

let fixtureDepartment: { id: number }
let director: DirectorAccount
let evaluationId: number | undefined
let courseId: number
let originalName: string

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    // Desasignar cuando no hay director responde 404, no un no-op.
    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount().then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
    })
  })
})

after(() => {
  // Restaura el nombre original mientras la cuenta todavía es directora del
  // departamento del curso — la ruta lo exige. El curso en sí no se puede
  // borrar (tiene grupos académicos), así que esto es lo único que deja
  // limpio el fixture compartido con `upload.cy.ts`.
  if (courseId && originalName) {
    cy.apiAs(director.email, director.password, 'PATCH', `/courses/${courseId}/name`, {
      name: originalName,
    })
  }

  if (evaluationId != null) {
    cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${evaluationId}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Renombrar una materia sin perder su código', () => {
  it('el director la renombra desde "Revisar materias" y el código no cambia', () => {
    cy.visitApp('/evaluaciones/cargar')
    cy.loginWithEmail(director.email, director.password)
    cy.location('pathname').should('eq', '/evaluaciones/cargar')

    cy.get('input[type="file"]').selectFile(FIXTURE, { force: true })
    cy.contains('button', 'Subir evaluación').click()

    cy.contains('Evaluación subida').should('be.visible')

    // El toast de éxito puede seguir tapando el botón cuando Cypress ya lo
    // considera listo para el clic (igual que en `upload.cy.ts`).
    cy.contains('button', 'Revisar materias').click({ force: true })

    cy.location('pathname')
      .should('match', /^\/evaluaciones\/\d+\/materias$/)
      .then((pathname) => {
        evaluationId = Number(pathname.split('/')[2])
      })

    // La página muestra un spinner mientras `status` sigue en `PROCESSING` y
    // se repregunta sola hasta que termina — el buscador no existe hasta
    // entonces, así que el timeout largo cubre esa espera.
    cy.get('input[aria-label="Buscar materia"]', { timeout: 15000 }).type(COURSE_CODE)

    // El buscador filtra por nombre o código: al filtrar por el código queda
    // una sola materia en la lista.
    cy.contains(COURSE_CODE, { timeout: 15000 }).should('be.visible')
    cy.contains('SISTEMAS OPERATIVOS').should('be.visible')

    // Como director, no como la cuenta de pruebas compartida: `/courses/` está
    // acotado al departamento del propio solicitante (ver `api/routes/courses.py`),
    // y el `before` de esta prueba acaba de dejar a esta cuenta —  no a la
    // compartida — como directora del departamento `99`. Con `cy.api` la
    // respuesta llegaba `200` pero con la lista vacía, y la prueba moría al
    // desestructurarla.
    apiAsDirector('GET', `/courses/?search=${COURSE_CODE}&limit=1`).then((response) => {
      expect(response.status, 'listado de materias del departamento').to.eq(200)

      const [course] = (
        response.body as { data: Array<{ id: number; code: string; name: string }> }
      ).data
      courseId = course.id
      originalName = course.name
      expect(course.code).to.eq(COURSE_CODE)
    })

    const newName = `Sistemas Operativos ${marca}`

    cy.get(`button[aria-label="Editar nombre de la materia ${COURSE_CODE}"]`).click()
    cy.get(`input[aria-label="Editar nombre de la materia ${COURSE_CODE}"]`).clear().type(newName)
    // El botón de guardar de `InlineEditText` es solo un ícono (sin texto),
    // así que va por su `aria-label`, no por `cy.contains`. La cabecera fija
    // de la página lo tapa cuando la fila queda arriba del todo tras filtrar.
    cy.get('button[aria-label="Guardar"]').click({ force: true })

    cy.contains('Materia actualizada exitosamente').should('be.visible')
    cy.contains('Actualizada').should('be.visible')

    // El nombre cambia; el código, al lado, sigue siendo el mismo — es la
    // parte del RF que importa: nada rompe el histórico ni las comparaciones
    // entre periodos, que se hacen por código. Sigue siendo la única fila
    // visible porque el buscador todavía filtra por `COURSE_CODE`.
    cy.contains(newName.toUpperCase()).should('be.visible')
    cy.contains(COURSE_CODE).should('be.visible')

    // `courseId` se resolvió en un `.then()` anterior — envolver en otro para
    // que el template string no se evalúe antes de que la variable exista.
    cy.then(() => apiAsDirector('GET', `/courses/${courseId}`)).then((response) => {
      expect(response.status, 'materia renombrada').to.eq(200)

      const course = (response.body as { data: { code: string; name: string } }).data
      expect(course.name).to.eq(newName.toUpperCase())
      expect(course.code).to.eq(COURSE_CODE)
    })

    // Sobrevive a una recarga: no es solo el estado optimista del formulario.
    cy.reload()
    cy.get('input[aria-label="Buscar materia"]').type(COURSE_CODE)
    cy.contains(newName.toUpperCase()).should('be.visible')
    cy.contains(COURSE_CODE).should('be.visible')
  })
})
