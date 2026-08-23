import { describe, expect, it } from 'vitest'

import { RISK_LEVELS, riskLevelColor } from '@/lib/riskLevel'
import {
  DEFAULT_DANGER_MAX,
  DEFAULT_SUCCESS_MIN,
  getScoreTone,
  getScoreToneBadgeClass,
  getScoreToneBgClass,
  getScoreToneClass,
  SCORE_TONE_BADGE_CLASS,
  SCORE_TONE_BG_CLASS,
  SCORE_TONE_TEXT_CLASS,
} from '@/lib/scoreTone'

describe('getScoreTone', () => {
  it('buckets a score into the three tones of the semaphore', () => {
    expect(getScoreTone(2.4)).toBe('danger')
    expect(getScoreTone(3.2)).toBe('warning')
    expect(getScoreTone(4.1)).toBe('success')
  })

  it('keeps both boundaries inside the amber band', () => {
    // Deliberate and load-bearing: `ScoreLegend` reads these same constants to
    // print "De 3.0 a 3.6", so moving one without the other makes the legend
    // describe a semaphore nobody is shown.
    expect(getScoreTone(DEFAULT_DANGER_MAX)).toBe('warning')
    expect(getScoreTone(DEFAULT_SUCCESS_MIN)).toBe('warning')
  })

  it('takes the caller own cutoffs when the scale is not the institutional one', () => {
    expect(getScoreTone(70, { dangerMax: 60, successMin: 80 })).toBe('warning')
    expect(getScoreTone(90, { dangerMax: 60, successMin: 80 })).toBe('success')
  })
})

describe('las tres formas del semáforo', () => {
  it('resuelven el mismo tono para el mismo valor', () => {
    for (const value of [1, 2.99, 3, 3.5, 3.6, 3.61, 5]) {
      const tone = getScoreTone(value)

      expect(getScoreToneClass(value)).toBe(SCORE_TONE_TEXT_CLASS[tone])
      expect(getScoreToneBgClass(value)).toBe(SCORE_TONE_BG_CLASS[tone])
      expect(getScoreToneBadgeClass(value)).toBe(SCORE_TONE_BADGE_CLASS[tone])
    }
  })

  it('cubren los tres tonos y ninguno más', () => {
    const tones = ['success', 'warning', 'danger']

    expect(Object.keys(SCORE_TONE_TEXT_CLASS).sort()).toEqual([...tones].sort())
    expect(Object.keys(SCORE_TONE_BG_CLASS).sort()).toEqual([...tones].sort())
    expect(Object.keys(SCORE_TONE_BADGE_CLASS).sort()).toEqual([...tones].sort())
  })

  it('usan la misma familia de color en las tres formas', () => {
    // El número, la barra y el chip de una misma nota tenían tres copias de la
    // paleta y podían separarse: verde en una, esmeralda en otra.
    const family = (className: string) => className.match(/(green|amber|red)/)?.[1]

    for (const tone of ['success', 'warning', 'danger'] as const) {
      expect(family(SCORE_TONE_BG_CLASS[tone])).toBe(family(SCORE_TONE_TEXT_CLASS[tone]))
      expect(family(SCORE_TONE_BADGE_CLASS[tone])).toBe(family(SCORE_TONE_TEXT_CLASS[tone]))
    }
  })

  it('le da variante oscura al chip, que es el que va sobre una superficie clara', () => {
    for (const tone of ['success', 'warning', 'danger'] as const) {
      expect(SCORE_TONE_BADGE_CLASS[tone]).toMatch(/dark:/)
    }
  })
})

describe('RISK_LEVELS', () => {
  it('es el único catálogo: mismos colores para todos los que lo pintan', () => {
    // Cuatro componentes y la paleta del PDF tenían su propia copia de estos
    // tres hex, y una de ellas había derivado a otro verde, ámbar y rojo.
    expect(RISK_LEVELS.map((level) => level.color)).toEqual(['#22c55e', '#f59e0b', '#ef4444'])
  })

  it('resuelve el color por el nombre que manda el API, sin importar la caja', () => {
    expect(riskLevelColor('ALTO')).toBe('#ef4444')
    expect(riskLevelColor('Alto')).toBe('#ef4444')
    expect(riskLevelColor('bajo')).toBe('#22c55e')
    expect(riskLevelColor(undefined)).toBeUndefined()
    expect(riskLevelColor('CRÍTICO')).toBeUndefined()
  })
})
