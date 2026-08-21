import { afterEach, describe, expect, it, vi } from 'vitest'

import { openPendingTab } from '@/lib/openPendingTab'

/** A stand-in for the tab the browser hands back, recording what is written. */
function fakeTab() {
  return {
    closed: false,
    location: { href: '' },
    document: { write: vi.fn(), close: vi.fn() },
    close: vi.fn(),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('openPendingTab', () => {
  it('abre la pestaña de inmediato, antes de tener el archivo', () => {
    const tab = fakeTab()
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never)

    openPendingTab()

    // Dentro del gesto del clic: abrirla después la mataría el bloqueador.
    expect(open).toHaveBeenCalledWith('', '_blank')
  })

  it('no la deja en blanco: escribe el aviso mientras el archivo baja', () => {
    const tab = fakeTab()
    vi.spyOn(window, 'open').mockReturnValue(tab as never)

    openPendingTab('Abriendo acta.pdf…')

    expect(tab.document.write).toHaveBeenCalledWith(expect.stringContaining('Abriendo acta.pdf…'))
    expect(tab.document.close).toHaveBeenCalled()
  })

  it('sustituye el aviso por el archivo cuando llega', () => {
    const tab = fakeTab()
    vi.spyOn(window, 'open').mockReturnValue(tab as never)

    openPendingTab().settle('blob:acta')

    expect(tab.location.href).toBe('blob:acta')
  })

  it('libera el blob en vez de dejarlo colgado en memoria', () => {
    vi.useFakeTimers()

    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(window, 'open').mockReturnValue(fakeTab() as never)

    openPendingTab().settle('blob:acta')

    expect(revoke).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60_000)

    expect(revoke).toHaveBeenCalledWith('blob:acta')

    vi.useRealTimers()
  })

  it('cierra la pestaña si el archivo nunca llegó', () => {
    const tab = fakeTab()
    vi.spyOn(window, 'open').mockReturnValue(tab as never)

    openPendingTab().fail()

    expect(tab.close).toHaveBeenCalled()
  })

  it('sigue entregando el archivo aunque el bloqueador se coma la pestaña', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    openPendingTab().settle('blob:acta')

    expect(open).toHaveBeenLastCalledWith('blob:acta', '_blank')
  })

  it('no revienta cuando la pestaña no se deja escribir', () => {
    const tab = fakeTab()
    tab.document.write.mockImplementation(() => {
      throw new Error('sandboxed')
    })
    vi.spyOn(window, 'open').mockReturnValue(tab as never)

    expect(() => openPendingTab().settle('blob:acta')).not.toThrow()
    expect(tab.location.href).toBe('blob:acta')
  })
})
