import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MultiFileDropzone } from '@/components/common/MultiFileDropzone'

function makeFile(name = 'presencial.pdf', size = 2048, type = 'application/pdf') {
  const file = new File(['x'], name, { type })

  // `File` size is derived from its content, so it is overridden to keep the
  // fixture readable without building a multi-KB blob.
  Object.defineProperty(file, 'size', { value: size })

  return file
}

/** The drop target is the box wrapping the (visually hidden) file input. */
function dropzoneOf(label = 'Archivos') {
  return screen.getByLabelText(label).parentElement as HTMLElement
}

describe('MultiFileDropzone', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prompts for files and states the per-file size limit when none are selected', () => {
    render(<MultiFileDropzone files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText('Selecciona los archivos')).toBeInTheDocument()
    expect(screen.getByText(/Máximo 10\.00 MB por archivo/)).toBeInTheDocument()
  })

  it('takes several files at once from the picker', async () => {
    const user = userEvent.setup()
    const onFilesAdded = vi.fn()
    const files = [makeFile('presencial.pdf'), makeFile('distancia.pdf')]

    render(<MultiFileDropzone files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />)

    await user.upload(screen.getByLabelText('Archivos'), files)

    expect(onFilesAdded).toHaveBeenCalledWith(files)
  })

  it('reports the files dropped onto the zone', () => {
    const onFilesAdded = vi.fn()
    const file = makeFile()

    render(<MultiFileDropzone files={[]} onFilesAdded={onFilesAdded} onRemove={vi.fn()} />)

    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [file] } })

    expect(onFilesAdded).toHaveBeenCalledWith([file])
  })

  it('lists every selected file with its size while still prompting for more', () => {
    render(
      <MultiFileDropzone
        files={[makeFile('presencial.pdf', 2048), makeFile('distancia.pdf', 4096)]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        maxFiles={3}
      />,
    )

    expect(screen.getByText('presencial.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
    expect(screen.getByText('distancia.pdf')).toBeInTheDocument()
    expect(screen.getByText('4.0 KB')).toBeInTheDocument()
    expect(screen.getByText('Selecciona los archivos')).toBeInTheDocument()
  })

  it('removes the file the button belongs to, by position', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <MultiFileDropzone
        files={[makeFile('presencial.pdf'), makeFile('distancia.pdf')]}
        onFilesAdded={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Quitar distancia.pdf' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('stops taking input once the maximum is reached', () => {
    render(
      <MultiFileDropzone
        files={[makeFile('presencial.pdf'), makeFile('distancia.pdf')]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        maxFiles={2}
      />,
    )

    expect(screen.getByText('Selección completa')).toBeInTheDocument()
    expect(screen.getByText(/Quita uno para cambiarlo/)).toBeInTheDocument()
    expect(screen.getByLabelText('Archivos')).toBeDisabled()
  })

  it('ignores a drop once the maximum is reached', () => {
    const onFilesAdded = vi.fn()

    render(
      <MultiFileDropzone
        files={[makeFile('presencial.pdf')]}
        onFilesAdded={onFilesAdded}
        onRemove={vi.fn()}
        maxFiles={1}
      />,
    )

    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [makeFile('distancia.pdf')] } })

    expect(onFilesAdded).not.toHaveBeenCalled()
  })

  it('reports progress and blocks removal while uploading', () => {
    render(
      <MultiFileDropzone
        files={[makeFile()]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        isUploading
      />,
    )

    expect(screen.getByText('Subiendo archivos…')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Subiendo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quitar/ })).toBeDisabled()
  })

  it('shows the error and links it to the input', () => {
    render(
      <MultiFileDropzone
        files={[]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        error="El archivo debe ser PDF."
      />,
    )

    const input = screen.getByLabelText('Archivos')
    const alert = screen.getByRole('alert')

    expect(alert).toHaveTextContent('El archivo debe ser PDF.')
    expect(input).toHaveAttribute('aria-describedby', alert.id)
  })

  it('renders no error region when there is no error', () => {
    render(<MultiFileDropzone files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Archivos')).not.toHaveAttribute('aria-describedby')
  })

  it('disables the input when disabled', () => {
    render(<MultiFileDropzone files={[]} onFilesAdded={vi.fn()} onRemove={vi.fn()} disabled />)

    expect(screen.getByLabelText('Archivos')).toBeDisabled()
  })

  it('opens the picked PDF in a tab of its own when its name is clicked', async () => {
    const user = userEvent.setup()
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:presencial')

    render(
      <MultiFileDropzone
        files={[makeFile()]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        maxFiles={2}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'presencial.pdf' }))

    expect(open).toHaveBeenCalledWith('blob:presencial', '_blank', 'noopener')

    open.mockRestore()
    createObjectURL.mockRestore()
  })

  it('leaves the name as plain text for a file the browser would only download', () => {
    // The dropzone is generic: `accept` can name anything.
    render(
      <MultiFileDropzone
        files={[makeFile('notas.csv', 512, 'text/csv')]}
        onFilesAdded={vi.fn()}
        onRemove={vi.fn()}
        maxFiles={2}
      />,
    )

    expect(screen.getByText('notas.csv')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'notas.csv' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar notas.csv' })).toBeInTheDocument()
  })
})
