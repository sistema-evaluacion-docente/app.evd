import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeacherUploadForm } from '@/features/teachers/components/TeacherUploadForm'
import type { TeacherUploadData } from '@/features/teachers/types'
import { renderRouted, screen, waitFor, within } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { post: vi.fn() } }))

const toast = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const mockApi = vi.mocked(api)

function csvFile(name = 'docentes.csv') {
  return new File(['codigo,correo'], name, { type: 'text/csv' })
}

function summary(overrides: Partial<TeacherUploadData['summary']> = {}) {
  return {
    total: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    already_active: 0,
    other_department: 0,
    errors: 0,
    ...overrides,
  }
}

const RESULT: TeacherUploadData = {
  summary: summary({ total: 3, updated: 1, already_active: 1, errors: 1 }),
  rows: [
    {
      row: 2,
      institutional_code: '00045',
      email: 'ana@ufps.edu.co',
      status: 'updated',
      detail: 'Correo actualizado: 00045@temp.local → ana@ufps.edu.co.',
    },
    {
      row: 3,
      institutional_code: '1325242',
      email: 'otro@ufps.edu.co',
      status: 'already_active',
      detail: 'Ya inició sesión con andres@ufps.edu.co; se respetó su correo.',
    },
    {
      row: 4,
      institutional_code: '101',
      email: 'bea@gmail.com',
      status: 'error',
      detail: 'El correo debe ser del dominio @ufps.edu.co',
    },
  ],
}

async function uploadWith(data: TeacherUploadData) {
  mockApi.post.mockResolvedValue({ data })
  const user = userEvent.setup()
  renderRouted(<TeacherUploadForm />)

  await user.upload(screen.getByLabelText('Archivo'), csvFile())
  await user.click(screen.getByRole('button', { name: 'Subir docentes' }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TeacherUploadForm', () => {
  it('disables submit until a file is picked', () => {
    renderRouted(<TeacherUploadForm />)

    expect(screen.getByRole('button', { name: 'Subir docentes' })).toBeDisabled()
  })

  it('explains the two-column format', () => {
    renderRouted(<TeacherUploadForm />)

    expect(
      screen.getByText(/dos columnas: el código y el correo institucional/),
    ).toBeInTheDocument()
  })

  it('shows the counters and every row with its reason, problems first', async () => {
    await uploadWith(RESULT)

    expect(await screen.findByText('Resultado de la carga')).toBeInTheDocument()
    expect(screen.getByText('Correos actualizados').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Con errores').nextSibling).toHaveTextContent('1')

    const bodyRows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(bodyRows[0]).toHaveTextContent('El correo debe ser del dominio @ufps.edu.co')
    expect(bodyRows[1]).toHaveTextContent('Ya tiene acceso')
    expect(bodyRows[2]).toHaveTextContent('Correo actualizado')

    expect(toast.warning).toHaveBeenCalledWith('Carga completada con 1 fila(s) con error')
  })

  it('celebrates a clean import with how many teachers can now log in', async () => {
    await uploadWith({
      summary: summary({ total: 2, created: 1, updated: 1 }),
      rows: [
        { row: 2, institutional_code: '1', email: 'a@ufps.edu.co', status: 'created', detail: '' },
        { row: 3, institutional_code: '2', email: 'b@ufps.edu.co', status: 'updated', detail: '' },
      ],
    })

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        '2 docente(s) ya pueden iniciar sesión con su correo',
      ),
    )
  })

  it('reports an empty file with nothing to process', async () => {
    await uploadWith({ summary: summary(), rows: [] })

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
