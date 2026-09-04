import { describe, expect, it, vi } from 'vitest'

import { downloadBlob } from '@/lib/downloadBlob'

describe('downloadBlob', () => {
  it('creates a temporary link, clicks it with the given filename, and revokes the object URL', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const createSpy = vi.spyOn(URL, 'createObjectURL')

    downloadBlob(new Blob(['hola']), 'reporte.pdf')

    expect(createSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeSpy).toHaveBeenCalledWith(createSpy.mock.results[0]?.value)

    clickSpy.mockRestore()
  })

  it('does not leave the link element in the document', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadBlob(new Blob(['x']), 'a.txt')

    expect(document.querySelector('a[download="a.txt"]')).toBeNull()

    vi.restoreAllMocks()
  })
})
