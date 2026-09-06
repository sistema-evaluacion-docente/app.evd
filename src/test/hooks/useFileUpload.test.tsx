import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFileUpload, useMultiFileUpload } from '@/hooks/useFileUpload'

function pdf(name = 'acta.pdf', size = 1024, type = 'application/pdf') {
  const file = new File(['x'.repeat(size)], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('useFileUpload', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useFileUpload())

    expect(result.current.file).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('accepts a valid pdf and calls onValidFile', () => {
    const onValidFile = vi.fn()
    const { result } = renderHook(() => useFileUpload({ onValidFile }))
    const file = pdf()

    act(() => result.current.handleFile(file))

    expect(result.current.file).toBe(file)
    expect(result.current.error).toBeNull()
    expect(onValidFile).toHaveBeenCalledWith(file)
  })

  it('rejects a file of the wrong type/extension', () => {
    const { result } = renderHook(() => useFileUpload())

    act(() => result.current.handleFile(pdf('foto.png', 1024, 'image/png')))

    expect(result.current.file).toBeNull()
    expect(result.current.error).toBe('El archivo debe ser PDF.')
  })

  it('accepts a matching extension even without a recognized MIME type', () => {
    const { result } = renderHook(() => useFileUpload())

    act(() => result.current.handleFile(pdf('acta.pdf', 1024, '')))

    expect(result.current.file).not.toBeNull()
  })

  it('rejects a file over the max size, in MB', () => {
    const { result } = renderHook(() => useFileUpload({ maxSize: 1024 }))

    act(() => result.current.handleFile(pdf('acta.pdf', 2048)))

    expect(result.current.error).toBe('El archivo supera el máximo permitido de 1.0 KB.')
  })

  it('clears the file and error when handed a falsy candidate', () => {
    const { result } = renderHook(() => useFileUpload())

    act(() => result.current.handleFile(pdf()))
    act(() => result.current.handleFile(null))

    expect(result.current.file).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('clear() resets file and error', () => {
    const { result } = renderHook(() => useFileUpload())

    act(() => result.current.handleFile(pdf('bad.png', 1, 'image/png')))
    expect(result.current.error).not.toBeNull()

    act(() => result.current.clear())

    expect(result.current.file).toBeNull()
    expect(result.current.error).toBeNull()
  })
})

describe('useMultiFileUpload', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useMultiFileUpload())

    expect(result.current.files).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('appends valid files and calls onChange', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useMultiFileUpload({ onChange }))
    const a = pdf('a.pdf')
    const b = pdf('b.pdf')

    act(() => result.current.addFiles([a, b]))

    expect(result.current.files).toEqual([a, b])
    expect(onChange).toHaveBeenCalledWith([a, b])
  })

  it('accepts a FileList-like object', () => {
    const { result } = renderHook(() => useMultiFileUpload())
    const a = pdf('a.pdf')

    act(() => result.current.addFiles({ length: 1, 0: a, [Symbol.iterator]: [a][Symbol.iterator] } as unknown as FileList))

    expect(result.current.files).toEqual([a])
  })

  it('does nothing when handed no candidates', () => {
    const { result } = renderHook(() => useMultiFileUpload())

    act(() => result.current.addFiles(null))

    expect(result.current.files).toEqual([])
  })

  it('keeps the good files in a batch, and reports the rejection', () => {
    const { result } = renderHook(() => useMultiFileUpload())
    const good = pdf('a.pdf')
    const bad = pdf('b.png', 1, 'image/png')

    act(() => result.current.addFiles([good, bad]))

    expect(result.current.files).toEqual([good])
    expect(result.current.error).toBe('El archivo debe ser PDF.')
  })

  it('rejects a duplicate file (same name and size)', () => {
    const { result } = renderHook(() => useMultiFileUpload())
    const a = pdf('a.pdf')

    act(() => result.current.addFiles([a]))
    act(() => result.current.addFiles([pdf('a.pdf')]))

    expect(result.current.files).toHaveLength(1)
    expect(result.current.error).toBe('Ya adjuntó "a.pdf".')
  })

  it('refuses candidates past maxFiles, singular wording included', () => {
    const { result } = renderHook(() => useMultiFileUpload({ maxFiles: 1 }))

    act(() => result.current.addFiles([pdf('a.pdf'), pdf('b.pdf')]))

    expect(result.current.files).toHaveLength(1)
    expect(result.current.error).toBe('Solo puede adjuntar 1 archivo.')
  })

  it('removeFile drops the file at the given index and calls onChange', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useMultiFileUpload({ onChange }))

    act(() => result.current.addFiles([pdf('a.pdf'), pdf('b.pdf')]))
    act(() => result.current.removeFile(0))

    expect(result.current.files.map((f) => f.name)).toEqual(['b.pdf'])
    expect(onChange).toHaveBeenLastCalledWith(result.current.files)
  })

  it('clear() empties the list and calls onChange with []', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useMultiFileUpload({ onChange }))

    act(() => result.current.addFiles([pdf('a.pdf')]))
    act(() => result.current.clear())

    expect(result.current.files).toEqual([])
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
