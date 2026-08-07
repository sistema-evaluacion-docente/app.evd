import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FileDropzone } from '@/components/common/FileDropzone'

function makeFile(name = 'informe.pdf', size = 2048, type = 'application/pdf') {
  const file = new File(['x'], name, { type })

  // `File` size is derived from its content, so it is overridden to keep the
  // fixture readable without building a multi-KB blob.
  Object.defineProperty(file, 'size', { value: size })

  return file
}

/** The drop target is the box wrapping the (visually hidden) file input. */
function dropzoneOf(label = 'Archivo') {
  return screen.getByLabelText(label).parentElement as HTMLElement
}

describe('FileDropzone', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prompts for a file and states the size limit when nothing is selected', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} />)

    expect(screen.getByText('Selecciona un archivo')).toBeInTheDocument()
    expect(screen.getByText(/Máximo 10\.00 MB/)).toBeInTheDocument()
  })

  it('states the custom size limit in the hint', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} maxSize={5 * 1024 * 1024} />)

    expect(screen.getByText(/Máximo 5\.00 MB/)).toBeInTheDocument()
  })

  it('uses the custom label, title and subtitle when given', () => {
    render(
      <FileDropzone
        file={null}
        onFileChange={vi.fn()}
        label="Listado de docentes"
        title="Sube el CSV"
        subtitle="Solo archivos exportados de Divisist"
      />,
    )

    expect(screen.getByText('Listado de docentes')).toBeInTheDocument()
    expect(screen.getByText('Sube el CSV')).toBeInTheDocument()
    expect(screen.getByText('Solo archivos exportados de Divisist')).toBeInTheDocument()
  })

  it('accepts PDF files in the native picker by default', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} />)

    expect(screen.getByLabelText('Archivo')).toHaveAttribute('accept', 'application/pdf,.pdf')
  })

  it('reports the file chosen through the picker', async () => {
    const user = userEvent.setup()
    const onFileChange = vi.fn()
    const file = makeFile()

    render(<FileDropzone file={null} onFileChange={onFileChange} />)

    await user.upload(screen.getByLabelText('Archivo'), file)

    expect(onFileChange).toHaveBeenCalledWith(file)
  })

  it('reports the file dropped onto the zone', () => {
    const onFileChange = vi.fn()
    const file = makeFile()

    render(<FileDropzone file={null} onFileChange={onFileChange} />)

    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [file] } })

    expect(onFileChange).toHaveBeenCalledWith(file)
  })

  it('reports null when a drop carries no file', () => {
    const onFileChange = vi.fn()

    render(<FileDropzone file={null} onFileChange={onFileChange} />)

    fireEvent.drop(dropzoneOf(), { dataTransfer: { files: [] } })

    expect(onFileChange).toHaveBeenCalledWith(null)
  })

  it('shows the name and size of the selected file', () => {
    render(<FileDropzone file={makeFile('evaluacion.pdf', 2048)} onFileChange={vi.fn()} />)

    expect(screen.getByText('evaluacion.pdf')).toBeInTheDocument()
    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
    expect(screen.queryByText('Selecciona un archivo')).not.toBeInTheDocument()
  })

  it('clears the selection from the remove button', async () => {
    const user = userEvent.setup()
    const onFileChange = vi.fn()

    render(<FileDropzone file={makeFile()} onFileChange={onFileChange} />)

    await user.click(screen.getByRole('button', { name: /Quitar archivo/ }))

    expect(onFileChange).toHaveBeenCalledTimes(1)
    expect(onFileChange).toHaveBeenCalledWith(null)
  })

  it('reports progress and blocks removal while uploading', () => {
    render(<FileDropzone file={makeFile()} onFileChange={vi.fn()} isUploading />)

    expect(screen.getByText('Subiendo archivo…')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Subiendo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quitar archivo/ })).toBeDisabled()
  })

  it('shows the error and links it to the input', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} error="El archivo supera los 10 MB" />)

    const input = screen.getByLabelText('Archivo')
    const alert = screen.getByRole('alert')

    expect(alert).toHaveTextContent('El archivo supera los 10 MB')
    expect(input).toHaveAttribute('aria-describedby', alert.id)
  })

  it('renders no error region when there is no error', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Archivo')).not.toHaveAttribute('aria-describedby')
  })

  it('disables the input when disabled', () => {
    render(<FileDropzone file={null} onFileChange={vi.fn()} disabled />)

    expect(screen.getByLabelText('Archivo')).toBeDisabled()
  })
})
