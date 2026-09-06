import { afterEach, describe, expect, it, vi } from 'vitest'

import { openLocalFile } from '@/lib/openLocalFile'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('openLocalFile', () => {
  it('opens an object URL for the file in a new tab, and revokes it after the grace period', () => {
    vi.useFakeTimers()
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const file = new File(['contenido'], 'archivo.pdf')

    openLocalFile(file)

    expect(createSpy).toHaveBeenCalledWith(file)
    expect(openSpy).toHaveBeenCalledWith('blob:local', '_blank', 'noopener')
    expect(revokeSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60_000)

    expect(revokeSpy).toHaveBeenCalledWith('blob:local')

    vi.useRealTimers()
  })
})
