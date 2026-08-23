import { describe, expect, it } from 'vitest'

import { DEFAULT_LANDING, nextParamFor, resolveNextPath } from '@/features/auth/lib/nextPath'

const DOCENTE = 'DOCENTE'
const DIRECTOR = 'DIRECTOR DE DEPARTAMENTO'

describe('resolveNextPath', () => {
  it('devuelve al docente al plan del que venía el correo', () => {
    expect(resolveNextPath('/mis-planes/42', DOCENTE)).toBe('/mis-planes/42')
  })

  it('conserva la query, que es parte del destino', () => {
    expect(resolveNextPath('/planes?docente=7&periodo=todos', DIRECTOR)).toBe(
      '/planes?docente=7&periodo=todos',
    )
  })

  it('manda al inicio cuando no venía de ningún sitio', () => {
    expect(resolveNextPath(null, DOCENTE)).toBe(DEFAULT_LANDING)
    expect(resolveNextPath('', DOCENTE)).toBe(DEFAULT_LANDING)
  })

  it('no manda a un docente a una ruta que es del director', () => {
    // Si no, el login solo cambiaría una pantalla de error por otra.
    expect(resolveNextPath('/planes/42', DOCENTE)).toBe(DEFAULT_LANDING)
  })

  it('ni al director a la del docente', () => {
    expect(resolveNextPath('/mis-planes/42', DIRECTOR)).toBe(DEFAULT_LANDING)
  })

  it('no acepta un destino fuera del sitio', () => {
    // El caso que importa: un enlace que parece nuestro y aterriza en otro
    // host justo después de que el usuario escribió su contraseña.
    for (const hostile of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      'http://evil.com/mis-planes/42',
      'javascript:alert(1)',
      'mis-planes/42',
    ]) {
      expect(resolveNextPath(hostile, DOCENTE)).toBe(DEFAULT_LANDING)
    }
  })

  it('no se manda a sí mismo, que sería un bucle', () => {
    expect(resolveNextPath('/login', DOCENTE)).toBe(DEFAULT_LANDING)
    expect(resolveNextPath('/login?next=%2Flogin', DOCENTE)).toBe(DEFAULT_LANDING)
  })

  it('sin rol no hay ruta que valga', () => {
    expect(resolveNextPath('/mis-planes/42', null)).toBe(DEFAULT_LANDING)
  })
})

describe('nextParamFor', () => {
  it('codifica la ruta para que sobreviva a la URL', () => {
    expect(nextParamFor('/mis-planes/42')).toBe('next=%2Fmis-planes%2F42')
  })

  it('incluye la query cuando la hay', () => {
    expect(nextParamFor('/planes', 'docente=7')).toBe('next=%2Fplanes%3Fdocente%3D7')
  })

  it('lo que produce es lo que el login sabe leer', () => {
    const param = nextParamFor('/mis-planes/42')
    const value = new URLSearchParams(param).get('next')

    expect(resolveNextPath(value, DOCENTE)).toBe('/mis-planes/42')
  })
})
