/**
 * RF — El sistema debe gestionar cursos y grupos académicos, incluida la
 * modalidad del grupo (presencial o a distancia).
 *
 * A diferencia de facultades, departamentos o programas, no hay una pantalla
 * de administración para cursos ni para grupos académicos: en producción el
 * sistema los crea al procesar el PDF de una evaluación — la modalidad viene
 * del título de cada página del documento ("Programas Presenciales" o
 * "Programas a Distancia", ver `api/utils/modalities.py` en `api.evd`), no de
 * un formulario. La única interfaz que toca estos recursos es de solo lectura
 * (`CourseSelect`) o de edición parcial (`EvaluationCoursesReview`, que solo
 * renombra un curso ya extraído). El resto de la gestión — crear, actualizar
 * y eliminar cursos, y crear, actualizar (incluida la modalidad) y eliminar
 * grupos — solo existe en la API real (`/courses/`, `/academic-groups/`), así
 * que esta prueba se queda en esa capa, como la parte "API" de
 * `security/access-control.cy.ts`.
 *
 * Fixture: un periodo académico y un docente desechables, compartidos por las
 * pruebas de grupos (`before`/`after`, igual que las dos pruebas de director
 * en `admin/departments.cy.ts` comparten una cuenta), y un curso propio por
 * prueba. Cada grupo se crea y se borra dentro de su propia prueba.
 */

const marca = `e2e-cursos-${Date.now()}`

/** Crea un curso desechable por API, con nombre y código únicos. */
function createCourse(label: string) {
  return cy
    .api('POST', '/courses/', {
      code: `${marca}-${label}`,
      name: `Curso de prueba ${marca}-${label}`,
    })
    .then((response) => (response.body as { data: { id: number; code: string } }).data)
}

describe('Gestión de cursos y grupos académicos', () => {
  let periodId: number
  let teacherId: number

  before(() => {
    cy.api('POST', '/academic-periods/', { name: marca }).then((response) => {
      periodId = (response.body as { data: { id: number } }).data.id
    })

    // institutional_code exige solo dígitos, así que la marca (con guiones y
    // letras) no sirve aquí: basta el timestamp, único de por sí.
    cy.api('POST', '/teachers/', { institutional_code: `${Date.now()}` }).then((response) => {
      teacherId = (response.body as { data: { id: number } }).data.id
    })
  })

  after(() => {
    cy.api('DELETE', `/teachers/${teacherId}`)
    cy.api('DELETE', `/academic-periods/${periodId}`)
  })

  it('crea un curso, lo consulta, actualiza su nombre y lo elimina', () => {
    createCourse('curso').then((curso) => {
      cy.api('GET', `/courses/${curso.id}`).then((response) => {
        const data = (response.body as { data: { name: string } }).data
        expect(data.name).to.eq(`Curso de prueba ${marca}-curso`)
      })

      cy.api('PUT', `/courses/${curso.id}`, { name: `Curso renombrado ${marca}` }).then(
        (response) => {
          const data = (response.body as { data: { name: string } }).data
          expect(data.name).to.eq(`Curso renombrado ${marca}`)
        },
      )

      cy.api('DELETE', `/courses/${curso.id}`)

      cy.api('GET', `/courses/?search=${curso.code}&limit=1`).then((response) => {
        const items = (response.body as { data: unknown[] }).data
        expect(items).to.have.length(0)
      })
    })
  })

  it('crea un grupo presencial y lo encuentra filtrando por esa modalidad', () => {
    createCourse('presencial').then((curso) => {
      cy.api('POST', '/academic-groups/', {
        course_id: curso.id,
        teacher_id: teacherId,
        academic_period_id: periodId,
        modality: 'PRESENCIAL',
      }).then((response) => {
        const grupo = (response.body as { data: { id: number; modality: string } }).data
        expect(grupo.modality).to.eq('PRESENCIAL')

        cy.api('GET', `/academic-groups/?course_id=${curso.id}&modality=PRESENCIAL`).then(
          (response) => {
            const items = (response.body as { data: Array<{ id: number }> }).data
            expect(items.map((item) => item.id)).to.include(grupo.id)
          },
        )

        cy.api('GET', `/academic-groups/?course_id=${curso.id}&modality=DISTANCIA`).then(
          (response) => {
            const items = (response.body as { data: Array<{ id: number }> }).data
            expect(items.map((item) => item.id)).to.not.include(grupo.id)
          },
        )

        cy.api('DELETE', `/academic-groups/${grupo.id}`)
      })

      cy.api('DELETE', `/courses/${curso.id}`)
    })
  })

  it('cambia la modalidad de un grupo de presencial a distancia', () => {
    createCourse('cambio-modalidad').then((curso) => {
      cy.api('POST', '/academic-groups/', {
        course_id: curso.id,
        teacher_id: teacherId,
        academic_period_id: periodId,
        modality: 'PRESENCIAL',
      }).then((response) => {
        const grupo = (response.body as { data: { id: number } }).data

        cy.api('PUT', `/academic-groups/${grupo.id}`, { modality: 'DISTANCIA' }).then(
          (response) => {
            const data = (response.body as { data: { modality: string } }).data
            expect(data.modality).to.eq('DISTANCIA')
          },
        )

        cy.api('GET', `/academic-groups/?course_id=${curso.id}&modality=DISTANCIA`).then(
          (response) => {
            const items = (response.body as { data: Array<{ id: number }> }).data
            expect(items.map((item) => item.id)).to.include(grupo.id)
          },
        )

        cy.api('GET', `/academic-groups/?course_id=${curso.id}&modality=PRESENCIAL`).then(
          (response) => {
            const items = (response.body as { data: Array<{ id: number }> }).data
            expect(items.map((item) => item.id)).to.not.include(grupo.id)
          },
        )

        cy.api('DELETE', `/academic-groups/${grupo.id}`)
      })

      cy.api('DELETE', `/courses/${curso.id}`)
    })
  })

  it('elimina un grupo académico y desaparece del listado', () => {
    createCourse('eliminar').then((curso) => {
      cy.api('POST', '/academic-groups/', {
        course_id: curso.id,
        teacher_id: teacherId,
        academic_period_id: periodId,
        modality: 'PRESENCIAL',
      }).then((response) => {
        const grupo = (response.body as { data: { id: number } }).data

        cy.api('DELETE', `/academic-groups/${grupo.id}`)

        cy.api('GET', `/academic-groups/?course_id=${curso.id}`).then((response) => {
          const items = (response.body as { data: Array<{ id: number }> }).data
          expect(items.map((item) => item.id)).to.not.include(grupo.id)
        })
      })

      cy.api('DELETE', `/courses/${curso.id}`)
    })
  })
})
