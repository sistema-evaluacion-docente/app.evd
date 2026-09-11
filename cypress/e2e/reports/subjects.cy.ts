/**
 * RF-5.7 (Media) — Listado de materias por periodo, con acceso directo al
 * detalle cuando un solo docente la dictó y comparación entre los docentes
 * cuando varios la dictaron bajo el mismo código.
 *
 * Corre contra la pila real, departamento "Sistemas" (código 52).
 * "SISTEMAS OPERATIVOS" (código 1155604) en 2026-1 tiene tres docentes
 * reales bajo el mismo código real — Julian Alfonso Rodriguez Castro TP
 * (4.76), Marco Antonio Adarme Jaimes (4.01) y Sofia Valentina Moreno Ruiz
 * (3.20, sembrada aparte para la paginación del ranking en RF-5.6) — así que
 * la comparación entre ellos es de verdad, no inventada. Sofia no tiene
 * puntajes por pregunta sembrados (solo su promedio general, suficiente para
 * el ranking), así que la comparación por dimensión se confirma con Marco y
 * Julian, que sí los tienen completos.
 *
 * "FUNDAMENTOS DE PROGRAMACION" (código 1155104) en 2025-1 tiene un único
 * docente real — la propia cuenta de pruebas (System Admin, 4.77) — útil
 * para probar el atajo directo a "Ver detalle" que salta la comparación
 * cuando no hay nadie más con quien comparar.
 */
describe('Materias', () => {
  beforeEach(() => {
    cy.watchApi()
    cy.visitApp('/login', 'DIRECTOR DE DEPARTAMENTO')
    cy.loginWithEmail()
    cy.location('pathname').should('eq', '/home')
  })

  describe('un solo docente dicta la materia', () => {
    beforeEach(() => {
      cy.visit('/materias?period=2025-1')
      cy.contains('FUNDAMENTOS DE PROGRAMACION', { timeout: 20000 }).should('be.visible')
    })

    it('un solo código bajo la materia salta directo al detalle del docente', () => {
      cy.contains('FUNDAMENTOS DE PROGRAMACION').closest('button').click()

      // Un único código y un único grupo: el enlace ya es "Ver detalle", sin
      // pasar por una fila de código intermedia a expandir.
      cy.contains('1155104').should('be.visible')
      cy.contains('Ver detalle').should('be.visible').click()

      cy.contains('h1', 'FUNDAMENTOS DE PROGRAMACION', { timeout: 20000 }).should('be.visible')
      cy.contains('System Admin').should('be.visible')
    })
  })

  describe('varios docentes dictan la misma materia', () => {
    beforeEach(() => {
      cy.visit('/materias?period=2026-1')
      cy.contains('SISTEMAS OPERATIVOS', { timeout: 20000 }).should('be.visible')
    })

    it('expande la materia y muestra a los tres docentes con su promedio', () => {
      cy.contains('SISTEMAS OPERATIVOS').closest('button').click()

      cy.contains('1155604').should('be.visible')
      cy.contains('1155604').closest('button').click()

      cy.contains('3 docentes').should('be.visible')
      cy.contains('a', 'Comparar').should('be.visible')

      // Fila del docente: <p nombre> → <div envoltorio> → <div identidad> →
      // <div fila> (hermano del bloque que trae el promedio).
      cy.contains('MARCO ANTONIO ADARME JAIMES')
        .parent()
        .parent()
        .parent()
        .should('contain.text', '4.01')

      cy.contains('JULIAN ALFONSO RODRIGUEZ CASTRO')
        .parent()
        .parent()
        .parent()
        .should('contain.text', '4.76')

      cy.contains('SOFIA VALENTINA MORENO RUIZ')
        .parent()
        .parent()
        .parent()
        .should('contain.text', '3.20')
    })

    it('compara el ranking y las dimensiones de los tres docentes', () => {
      cy.contains('SISTEMAS OPERATIVOS').closest('button').click()
      cy.contains('1155604').closest('button').click()
      cy.contains('a', 'Comparar').click()

      cy.contains('h1', 'Comparación de docentes', { timeout: 20000 }).should('be.visible')

      // Ranking por promedio general, de mayor a menor.
      cy.contains('h2', 'Ranking por promedio general')
        .parent()
        .next()
        .find('> div')
        .should(($rows) => {
          const texts = Cypress._.map($rows.toArray(), (row) => row.textContent ?? '')
          expect(texts[0], 'primer lugar').to.include('JULIAN')
          expect(texts[0], 'primer lugar').to.include('4.76')
          expect(texts[1], 'segundo lugar').to.include('MARCO ANTONIO')
          expect(texts[1], 'segundo lugar').to.include('4.01')
          expect(texts[2], 'tercer lugar').to.include('SOFIA')
          expect(texts[2], 'tercer lugar').to.include('3.20' )
        })

      // Comparación por dimensión — Sofia no tiene puntajes por pregunta
      // sembrados, así que el mejor/peor real de cada dimensión se decide
      // entre Marco y Julian, los dos con datos completos.
      cy.contains('h3', 'Desarrollo del Conocimiento')
        .closest('section')
        .should('contain.text', 'Mayor nota:')
        .and('contain.text', 'JULIAN ALFONSO RODRIGUEZ CASTRO')
        .and('contain.text', 'Menor nota:')
        .and('contain.text', 'MARCO ANTONIO ADARME JAIMES')
    })
  })
})
