import { describe, expect, it } from 'vitest'

import { ApiError, extractApiErrorMessage } from '@/lib/apiError'

describe('ApiError', () => {
  it('carries the code and status alongside the message', () => {
    const error = new ApiError('No autorizado', { code: 'AUTH_ERROR', status: 401 })

    expect(error.message).toBe('No autorizado')
    expect(error.name).toBe('ApiError')
    expect(error.code).toBe('AUTH_ERROR')
    expect(error.status).toBe(401)
  })

  it('leaves code and status undefined when none are given', () => {
    const error = new ApiError('Falla')

    expect(error.code).toBeUndefined()
    expect(error.status).toBeUndefined()
  })
})

describe('extractApiErrorMessage', () => {
  it('returns a plain string payload untouched', () => {
    expect(extractApiErrorMessage('Servidor caído')).toBe('Servidor caído')
  })

  it('returns "" for a payload with nothing usable', () => {
    expect(extractApiErrorMessage(null)).toBe('')
    expect(extractApiErrorMessage(undefined)).toBe('')
    expect(extractApiErrorMessage(42)).toBe('')
    expect(extractApiErrorMessage({})).toBe('')
  })

  it('reads { message }', () => {
    expect(extractApiErrorMessage({ message: 'Falló la carga' })).toBe('Falló la carga')
  })

  it('reads { detail } when there is no message', () => {
    expect(extractApiErrorMessage({ detail: 'No encontrado' })).toBe('No encontrado')
  })

  it('reads { error: string }', () => {
    expect(extractApiErrorMessage({ error: 'Algo salió mal' })).toBe('Algo salió mal')
  })

  it('reads { error: { message } }', () => {
    expect(extractApiErrorMessage({ error: { code: 'X', message: 'Detalle del error' } })).toBe(
      'Detalle del error',
    )
  })

  it('formats { error: { details: { errors } } } as one line per field, dropping the query. prefix', () => {
    const payload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'ignored in favor of the field errors',
        details: {
          errors: [
            { field: 'query.periodo', message: 'es requerido' },
            { field: 'nombre', message: 'muy corto' },
          ],
        },
      },
    }

    expect(extractApiErrorMessage(payload)).toBe('periodo: es requerido. nombre: muy corto')
  })

  it('falls back to "Campo" when a field error carries no field name', () => {
    const payload = { error: { details: { errors: [{ message: 'inválido' }] } } }

    expect(extractApiErrorMessage(payload)).toBe('Campo: inválido')
  })

  it('drops field errors that carry no message', () => {
    const payload = {
      error: { details: { errors: [{ field: 'x', message: '  ' }, { field: 'y', message: 'ok' }] } },
    }

    expect(extractApiErrorMessage(payload)).toBe('y: ok')
  })

  it('falls back past an empty field-errors array to the error message', () => {
    const payload = { error: { message: 'sin detalles', details: { errors: [] } } }

    expect(extractApiErrorMessage(payload)).toBe('sin detalles')
  })

  it('prefers the field errors over a top-level message and detail', () => {
    const payload = {
      error: { details: { errors: [{ field: 'a', message: 'malo' }] } },
      message: 'no debería verse',
      detail: 'tampoco',
    }

    expect(extractApiErrorMessage(payload)).toBe('a: malo')
  })
})
