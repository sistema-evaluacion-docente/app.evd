/**
 * RF — Extracción del docente, el curso, el grupo, las 22 preguntas, las 4
 * dimensiones, los puntajes y los comentarios.
 *
 * No hay pantalla que "haga" esta extracción: ocurre sola al procesar el PDF
 * que sube un director (`upload.cy.ts` prueba esa carga). Este RF es sobre el
 * resultado de ese procesamiento, así que la prueba se queda en la capa de
 * API — igual que `academic-groups.cy.ts` hace para los cursos y grupos que
 * el mismo procesamiento produce sin pantalla propia — y usa el mismo PDF
 * real de la universidad, `cypress/files/2025-1.pdf`, contra el departamento
 * de código fijo `99` ("Testing") que trae impreso.
 *
 * Verificado contra el backend real antes de escribir esta prueba
 * (`POST /evaluations/upload` responde `202`, el procesamiento en este PDF
 * termina en menos de un segundo): tras subir el PDF y esperar a que
 * `GET /evaluations/{id}` marque `status: "COMPLETED"`,
 * `GET /evaluations/teachers/{teacher_id}/detail` devuelve, por cada curso
 * (materia + grupo) que dictó el docente, sus 4 dimensiones con las 22
 * preguntas y el puntaje de cada una — y
 * `GET /evaluations/{evaluation_id}/teachers/{teacher_id}/comments` los
 * comentarios de los estudiantes, ya extraídos con su texto aunque el
 * análisis de IA (`ai_status`) siga `PENDING`: la extracción del texto no
 * depende de esa clasificación posterior.
 *
 * Como en `upload.cy.ts`, el departamento `99` no puede aleatorizarse (viene
 * impreso en el PDF) y el procesamiento en segundo plano deja profesores,
 * cursos y grupos que no se pueden borrar en bloque. Lo único que esta prueba
 * limpia es lo suyo: la evaluación que ella misma crea y la cuenta de
 * director.
 */

import { apiUrl, tokenFor } from '../../support/commands'

const marca = `e2e-extraccion-${Date.now()}`
const FIXTURE = 'cypress/files/2025-1.pdf'
const MAX_POLL_ATTEMPTS = 20

interface DirectorAccount {
  uid: string
  email: string
  password: string
  id: number
}

interface EvaluationOut {
  id: number
  academic_period_id: number
  academic_period_code: string
  department_id: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

interface QuestionDetail {
  code: string
  score: number
}

interface DimensionDetail {
  dimension: string
  questions: QuestionDetail[]
}

interface CourseDetail {
  course_code: string
  course_name: string
  group_name: string
  dimensions: DimensionDetail[]
}

interface TeacherDetail {
  teacher_id: number
  name: string
  courses: CourseDetail[]
}

/** Crea, por API, una cuenta real de Firebase con el rol de director, sin
 * asignarla todavía a ningún departamento (igual que `upload.cy.ts`). */
function createDirectorAccount(): Cypress.Chainable<DirectorAccount> {
  const email = `${marca}@ufps.edu.co`
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

/** Busca el departamento de código `99` que exige el PDF; lo crea si nadie lo
 * ha hecho todavía (igual que `upload.cy.ts`). Incluye si ya tiene director —
 * desasignar cuando no hay ninguno responde `404`, no un no-op. */
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

/** Sondea `GET /evaluations/{id}` hasta que el procesamiento del PDF termina.
 * No hay retry-ability nativo para `cy.request`, así que reintenta a mano:
 * hasta veinte veces con un segundo de espera entre cada una, más que de
 * sobra para un PDF que en el servidor real termina en menos de un segundo. */
function waitForProcessedEvaluation(
  evaluationId: number,
  attempt = 0,
): Cypress.Chainable<EvaluationOut> {
  return cy.api('GET', `/evaluations/${evaluationId}`).then((response) => {
    const evaluation = (response.body as { data: EvaluationOut }).data

    if (evaluation.status === 'COMPLETED') return cy.wrap(evaluation)
    if (evaluation.status === 'FAILED') {
      throw new Error(`El procesamiento del PDF falló para la evaluación ${evaluationId}.`)
    }
    if (attempt >= MAX_POLL_ATTEMPTS) {
      throw new Error(
        `La evaluación ${evaluationId} sigue en "${evaluation.status}" tras ${MAX_POLL_ATTEMPTS} intentos.`,
      )
    }

    cy.wait(1000)

    return waitForProcessedEvaluation(evaluationId, attempt + 1)
  })
}

let fixtureDepartment: { id: number }
let director: DirectorAccount
let createdEvaluationId: number | undefined

before(() => {
  findOrCreateFixtureDepartment().then(({ id, hasDirector }) => {
    fixtureDepartment = { id }

    if (hasDirector) cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)

    createDirectorAccount().then((account) => {
      director = account
      cy.api('POST', `/departments/${fixtureDepartment.id}/director`, { user_id: account.id })
    })
  })
})

after(() => {
  // Solo el director del departamento de la evaluación puede borrarla, igual
  // que en `upload.cy.ts`.
  if (createdEvaluationId != null) {
    cy.apiAs(director.email, director.password, 'DELETE', `/evaluations/${createdEvaluationId}`)
  }

  cy.api('DELETE', `/departments/${fixtureDepartment.id}/director`)
  cy.api('PATCH', `/users/${director.uid}/status`, { active: false })
})

describe('Extracción de los datos del PDF de evaluación', () => {
  it('extrae el docente, el curso, el grupo, las 4 dimensiones con sus 22 preguntas, los puntajes y los comentarios', () => {
    tokenFor(director.email, director.password).then((token) => {
      cy.task('uploadMultipart', {
        url: apiUrl('/evaluations/upload'),
        token,
        files: [{ filename: '2025-1.pdf', path: FIXTURE }],
      }).then((result) => {
        const { status, body } = result as { status: number; body: { data: EvaluationOut } }

        expect(status).to.eq(202)
        createdEvaluationId = body.data.id

        waitForProcessedEvaluation(createdEvaluationId).then((evaluation) => {
          expect(evaluation.department_id).to.eq(fixtureDepartment.id)
          expect(evaluation.academic_period_code).to.eq('2025-2')

          // El listado de docentes del periodo es el punto de entrada real a
          // lo que la extracción produjo: si el PDF se procesó, aparece al
          // menos un docente aquí.
          cy.api('GET', `/evaluations/period/${evaluation.academic_period_id}/teachers`).then(
            (teachersResponse) => {
              const teachers = (
                teachersResponse.body as { data: Array<{ teacher_id: number; name: string }> }
              ).data
              expect(teachers.length).to.be.greaterThan(0)

              const [teacher] = teachers
              expect(teacher.name.length).to.be.greaterThan(0)

              cy.api(
                'GET',
                `/evaluations/teachers/${teacher.teacher_id}/detail?period_name=${evaluation.academic_period_code}&compare_previous=false`,
              ).then((detailResponse) => {
                const detail = (detailResponse.body as { data: TeacherDetail }).data

                // Docente.
                expect(detail.name).to.eq(teacher.name)
                expect(detail.courses.length).to.be.greaterThan(0)

                const [course] = detail.courses

                // Curso y grupo.
                expect(course.course_code.length).to.be.greaterThan(0)
                expect(course.course_name.length).to.be.greaterThan(0)
                expect(course.group_name.length).to.be.greaterThan(0)

                // Las 4 dimensiones.
                expect(course.dimensions).to.have.length(4)

                // Las 22 preguntas, repartidas entre esas 4 dimensiones, sin
                // repetirse — y cada una con su puntaje.
                const questions = course.dimensions.flatMap((dimension) => dimension.questions)
                expect(questions).to.have.length(22)
                expect(new Set(questions.map((question) => question.code)).size).to.eq(22)
                questions.forEach((question) => {
                  expect(question.score).to.be.a('number')
                })
              })

              // Comentarios: el texto se extrae del PDF independientemente
              // del análisis de IA posterior (`ai_status` sigue `PENDING`
              // aquí, y aun así hay texto real).
              cy.api(
                'GET',
                `/evaluations/${createdEvaluationId}/teachers/${teacher.teacher_id}/comments`,
              ).then((commentsResponse) => {
                const courses = (
                  commentsResponse.body as {
                    data: { courses: Array<{ comments: Array<{ original_text: string | null }> }> }
                  }
                ).data.courses

                const comments = courses.flatMap((c) => c.comments)
                expect(comments.length).to.be.greaterThan(0)
                expect((comments[0].original_text ?? '').length).to.be.greaterThan(0)
              })
            },
          )
        })
      })
    })
  })
})
