import { describe, expect, it } from 'vitest'

import { categoryForDimension, parseCategoryId } from '@/lib/categoryLabel'
import { periodOptionsFrom } from '@/lib/periodOptions'

describe('parseCategoryId', () => {
  it('reads a known category id, from a string or a number', () => {
    expect(parseCategoryId('2')).toBe(2)
    expect(parseCategoryId(5)).toBe(5)
  })

  it('drops anything that is not a category', () => {
    expect(parseCategoryId('9')).toBeUndefined()
    expect(parseCategoryId('abc')).toBeUndefined()
    expect(parseCategoryId('')).toBeUndefined()
    expect(parseCategoryId(null)).toBeUndefined()
  })
})

describe('categoryForDimension', () => {
  it('matches each evaluation dimension to its comment category, ignoring case', () => {
    expect(categoryForDimension('Desarrollo del Conocimiento')?.code).toBe('LABEL_0')
    expect(categoryForDimension('Desempeño Docente')?.code).toBe('LABEL_1')
    expect(categoryForDimension('Procesos de Evaluación')?.code).toBe('LABEL_2')
    expect(categoryForDimension('Integración Interpersonal')?.code).toBe('LABEL_3')
  })

  it('finds nothing for a dimension without a category', () => {
    expect(categoryForDimension('Otra cosa')).toBeUndefined()
  })
})

describe('periodOptionsFrom', () => {
  it('keeps one option per period, falling back to the code for the name', () => {
    expect(
      periodOptionsFrom([
        { academic_period_id: 1, academic_period_code: '2028-1', academic_period_name: null },
        { academic_period_id: 1, academic_period_code: '2028-1', academic_period_name: null },
        { academic_period_id: 2, academic_period_code: '2028-2', academic_period_name: '2028-II' },
      ]),
    ).toEqual([
      { id: 1, code: '2028-1', name: '2028-1' },
      { id: 2, code: '2028-2', name: '2028-II' },
    ])
  })
})
