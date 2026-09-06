import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeacherUploadForm } from '@/features/teachers/components/TeacherUploadForm'
import { renderRouted, screen, waitFor } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { post: vi.fn() } }))

const toast = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const mockApi = vi.mocked(api)

function csvFile(name = 'docentes.csv') {
  return new File(['nombre,codigo'], name, { type: 'text/csv' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TeacherUploadForm', () => {
  it('disables submit until a file is picked', () => {
    renderRouted(<TeacherUploadForm />)

    expect(screen.getByRole('button', { name: 'Subir docentes' })).toBeDisabled()
  })

  it('uploads the file and logs created, skipped and error entries', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        created: [{ name: 'Ada Lovelace' }],
        skipped: [{ name: 'Grace Hopper', reason: 'Ya existe' }],
        errors: [{ institutional_code: 'X-1', reason: 'Correo inválido' }],
      },
    })
    const user = userEvent.setup()
    renderRouted(<TeacherUploadForm />)

    await user.upload(screen.getByLabelText('Archivo'), csvFile())
    await user.click(screen.getByRole('button', { name: 'Subir docentes' }))

    expect(await screen.findByText('Creado: Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Omitido: Grace Hopper — Ya existe')).toBeInTheDocument()
    expect(screen.getByText('Error: X-1 — Correo inválido')).toBeInTheDocument()
    expect(toast.warning).toHaveBeenCalledWith('Importación completada con 1 error(es)')
  })

  it('celebrates a clean import with no errors', async () => {
    mockApi.post.mockResolvedValue({ data: { created: [{ name: 'Ada' }], skipped: [], errors: [] } })
    const user = userEvent.setup()
    renderRouted(<TeacherUploadForm />)

    await user.upload(screen.getByLabelText('Archivo'), csvFile())
    await user.click(screen.getByRole('button', { name: 'Subir docentes' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('1 docente(s) importado(s) exitosamente'),
    )
  })

  it('reports an empty file with nothing to process', async () => {
    mockApi.post.mockResolvedValue({ data: { created: [], skipped: [], errors: [] } })
    const user = userEvent.setup()
    renderRouted(<TeacherUploadForm />)

    await user.upload(screen.getByLabelText('Archivo'), csvFile())
    await user.click(screen.getByRole('button', { name: 'Subir docentes' }))

    expect(
      await screen.findByText('El archivo no contenía registros para procesar.'),
    ).toBeInTheDocument()
  })

  it('navigates away on cancel', async () => {
    const user = userEvent.setup()
    const { history } = renderRouted(<TeacherUploadForm />, { path: '/docentes/cargar' })

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(history.at(-1)).toBe('/docentes'))
  })

  it('rejects a file over the 5 MB limit, leaving the upload button disabled', async () => {
    const user = userEvent.setup()
    renderRouted(<TeacherUploadForm />)
    const tooLarge = csvFile()
    Object.defineProperty(tooLarge, 'size', { value: 6 * 1024 * 1024 })

    await user.upload(screen.getByLabelText('Archivo'), tooLarge)

    expect(
      await screen.findByText('El archivo supera el máximo permitido de 5 MB.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subir docentes' })).toBeDisabled()
  })
})
