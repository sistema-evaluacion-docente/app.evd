import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAddEvidenceComment,
  useCreateEvidenceRequest,
  useDeleteEvidence,
  useDownloadEvidence,
  useGetEvidenceRequests,
  usePreviewEvidence,
  useReviewEvidence,
  useUploadEvidence,
} from '@/features/plans/api'
import { PlanEvidences } from '@/features/plans/components/PlanEvidences'
import type { Plan, PlanEvidence, PlanEvidenceRequest } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useAddEvidenceComment: vi.fn(),
  useCreateEvidenceRequest: vi.fn(),
  useDeleteEvidence: vi.fn(),
  useDownloadEvidence: vi.fn(),
  useGetEvidenceRequests: vi.fn(),
  usePreviewEvidence: vi.fn(),
  useReviewEvidence: vi.fn(),
  useUploadEvidence: vi.fn(),
}))

function evidence(overrides: Partial<PlanEvidence> = {}): PlanEvidence {
  return {
    id: 31,
    plan_id: 7,
    item_id: null,
    request_id: 5,
    uploaded_by: 2,
    uploader_name: 'Ana Docente',
    description: 'listas_asistencia.pdf',
    file_url: '/files/31.pdf',
    status: 'PENDIENTE',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-05-04T10:00:00Z',
    ...overrides,
  }
}

function request(overrides: Partial<PlanEvidenceRequest> = {}): PlanEvidenceRequest {
  return {
    id: 5,
    plan_id: 7,
    item_id: null,
    requested_by: 1,
    title: 'Listas de asistencia semanas 1-8',
    description: null,
    status: 'PENDIENTE',
    due_date: null,
    evidences: [evidence()],
    comments: [],
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

const PLAN = { id: 7, items: [] } as unknown as Plan

const mutations = () => ({ mutate: vi.fn(), isPending: false, variables: undefined })

function makePdf(name = 'listas_asistencia.pdf') {
  return new File(['x'], name, { type: 'application/pdf' })
}

/** Renders one request and returns its evidence row. */
function renderRequest(overrides: Partial<PlanEvidenceRequest> = {}, canManage = true) {
  vi.mocked(useGetEvidenceRequests).mockReturnValue({
    data: { data: [request(overrides)] },
    isPending: false,
  } as never)

  return render(<PlanEvidences plan={PLAN} canManage={canManage} />)
}

beforeEach(() => {
  for (const hook of [
    useAddEvidenceComment,
    useCreateEvidenceRequest,
    useDeleteEvidence,
    useDownloadEvidence,
    usePreviewEvidence,
    useReviewEvidence,
    useUploadEvidence,
  ]) {
    vi.mocked(hook).mockReturnValue(mutations() as never)
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('PlanEvidences · solicitar evidencia', () => {
  function renderEmpty(canManage = true) {
    vi.mocked(useGetEvidenceRequests).mockReturnValue({
      data: { data: [] },
      isPending: false,
    } as never)

    return render(<PlanEvidences plan={PLAN} canManage={canManage} />)
  }

  it('el docente no ve el botón para solicitar evidencia', () => {
    renderEmpty(false)

    expect(screen.queryByRole('button', { name: 'Solicitar evidencia' })).not.toBeInTheDocument()
  })

  it('avisa que el docente recibirá una notificación y un correo', async () => {
    const user = userEvent.setup()
    renderEmpty()

    await user.click(screen.getByRole('button', { name: 'Solicitar evidencia' }))

    expect(
      await screen.findByText(
        'El docente recibirá una notificación en la plataforma y un correo con el entregable solicitado.',
      ),
    ).toBeInTheDocument()
  })

  it('no envía la solicitud sin título', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useCreateEvidenceRequest).mockReturnValue({ mutate, isPending: false } as never)
    renderEmpty()

    await user.click(screen.getByRole('button', { name: 'Solicitar evidencia' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Solicitar' }))

    expect(mutate).not.toHaveBeenCalled()
  })

  it('envía la solicitud con el título, descripción y fecha capturados', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useCreateEvidenceRequest).mockReturnValue({ mutate, isPending: false } as never)
    renderEmpty()

    await user.click(screen.getByRole('button', { name: 'Solicitar evidencia' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Título'), 'Listas de asistencia')
    await user.type(within(dialog).getByLabelText('Descripción'), 'Semanas 1 a 8')
    await user.click(within(dialog).getByRole('button', { name: 'Solicitar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Listas de asistencia',
        description: 'Semanas 1 a 8',
      }),
      expect.anything(),
    )
  })
})

describe('PlanEvidences · la evidencia entregada', () => {
  it('se llama como el archivo que el docente subió', () => {
    renderRequest()

    expect(screen.getByRole('button', { name: 'listas_asistencia.pdf' })).toBeInTheDocument()
    expect(screen.queryByText(/Evidencia #31/)).not.toBeInTheDocument()
  })

  it('cae al número sólo cuando se subió sin nombre, antes de que se pidiera', () => {
    renderRequest({ evidences: [evidence({ description: null })] })

    expect(screen.getByRole('button', { name: 'Evidencia #31' })).toBeInTheDocument()
  })

  it('se abre en una pestaña nueva al hacer clic en su nombre', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    vi.mocked(usePreviewEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.click(screen.getByRole('button', { name: 'listas_asistencia.pdf' }))

    // La pestaña se abre dentro del gesto, antes de pedir el blob.
    expect(open).toHaveBeenCalledWith('', '_blank')
    expect(mutate).toHaveBeenCalledWith(31, expect.anything())

    open.mockRestore()
  })

  it('se descarga con ese mismo nombre, no con uno inventado', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useDownloadEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.click(screen.getByRole('button', { name: /Descargar listas_asistencia\.pdf/ }))

    expect(mutate).toHaveBeenCalledWith({ evidenceId: 31, filename: 'listas_asistencia.pdf' })
  })

  it('le pone la extensión al nombre que el docente escribió a mano', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useDownloadEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest({ evidences: [evidence({ description: 'Listas de asistencia' })] })

    await user.click(screen.getByRole('button', { name: /Descargar Listas de asistencia/ }))

    expect(mutate).toHaveBeenCalledWith({ evidenceId: 31, filename: 'Listas de asistencia.pdf' })
  })

  it('sólo el director la quita, y confirmando', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useDeleteEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.click(screen.getByRole('button', { name: /Eliminar listas_asistencia\.pdf/ }))

    expect(await screen.findByText(/¿Eliminar esta evidencia\?/)).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(mutate).toHaveBeenCalledWith(31, expect.anything())
  })

  it('al docente ni se le ofrece quitarla', () => {
    renderRequest({}, false)

    expect(screen.getByRole('button', { name: 'listas_asistencia.pdf' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument()
  })
})

describe('PlanEvidences · adjuntar', () => {
  it('nombra la evidencia con el archivo elegido', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useUploadEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest({ evidences: [] })

    await user.click(screen.getByRole('button', { name: /Adjuntar/ }))
    await user.upload(await screen.findByLabelText('Archivo'), makePdf())

    expect(screen.getByLabelText('Título')).toHaveValue('listas_asistencia.pdf')

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Adjuntar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 5, description: 'listas_asistencia.pdf' }),
      expect.anything(),
    )
  })

  it('respeta el título que el docente escribe, aunque cambie de archivo', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useUploadEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest({ evidences: [] })

    await user.click(screen.getByRole('button', { name: /Adjuntar/ }))
    await user.upload(await screen.findByLabelText('Archivo'), makePdf())
    await user.clear(screen.getByLabelText('Título'))
    await user.type(screen.getByLabelText('Título'), 'Listas de asistencia')
    await user.upload(screen.getByLabelText('Archivo'), makePdf('otro_archivo.pdf'))

    expect(screen.getByLabelText('Título')).toHaveValue('Listas de asistencia')

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Adjuntar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Listas de asistencia' }),
      expect.anything(),
    )
  })
})

describe('PlanEvidences · aprobar o rechazar', () => {
  it('aprueba una evidencia pendiente', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useReviewEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.click(screen.getByRole('button', { name: 'Aprobar' }))

    expect(mutate).toHaveBeenCalledWith({ evidenceId: 31, payload: { status: 'APROBADA' } })
  })

  it('rechaza con el comentario ya escrito en la caja de comentarios', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useReviewEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.type(screen.getByPlaceholderText('Escribe un comentario…'), 'Falta la firma')
    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(mutate).toHaveBeenCalledWith({
      evidenceId: 31,
      payload: { status: 'RECHAZADA', comment: 'Falta la firma' },
    })
  })

  it('rechaza sin comentario cuando la caja está vacía', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useReviewEvidence).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(mutate).toHaveBeenCalledWith({
      evidenceId: 31,
      payload: { status: 'RECHAZADA', comment: undefined },
    })
  })

  it('ya no ofrece Aprobar/Rechazar una vez la evidencia salió de pendiente', () => {
    renderRequest({ evidences: [evidence({ status: 'APROBADA' })] })

    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
  })

  it('al docente no se le ofrece aprobar ni rechazar', () => {
    renderRequest({}, false)

    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
  })
})

describe('PlanEvidences · hilo de comentarios', () => {
  it('publica un comentario con Enter y limpia la caja', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useAddEvidenceComment).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    const box = screen.getByPlaceholderText('Escribe un comentario…')
    await user.type(box, 'Ya lo reviso{Enter}')

    expect(mutate).toHaveBeenCalledWith(
      { requestId: 5, body: 'Ya lo reviso' },
      expect.anything(),
    )
  })

  it('publica un comentario con el botón de enviar', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useAddEvidenceComment).mockReturnValue({ mutate, isPending: false } as never)

    renderRequest()

    await user.type(screen.getByPlaceholderText('Escribe un comentario…'), 'Ya lo reviso')
    await user.click(screen.getByRole('button', { name: 'Enviar comentario' }))

    expect(mutate).toHaveBeenCalledWith(
      { requestId: 5, body: 'Ya lo reviso' },
      expect.anything(),
    )
  })

  it('no deja enviar un comentario vacío', () => {
    renderRequest()

    expect(screen.getByRole('button', { name: 'Enviar comentario' })).toBeDisabled()
  })

  it('distingue un comentario del sistema de uno humano', () => {
    renderRequest({
      comments: [
        {
          id: 1,
          request_id: 5,
          author_id: null,
          author_name: null,
          body: 'La entrega volvió a quedar pendiente.',
          is_system: true,
          created_at: null,
        },
        {
          id: 2,
          request_id: 5,
          author_id: 9,
          author_name: 'Ana Directora',
          body: 'Por favor ajusta el formato.',
          is_system: false,
          created_at: null,
        },
      ],
    })

    const systemLine = screen.getByText(/La entrega volvió a quedar pendiente\./)
    const humanLine = screen.getByText(/Por favor ajusta el formato\./)

    expect(systemLine.closest('li')).toHaveTextContent('Sistema:')
    expect(systemLine.closest('li')).toHaveClass('italic')
    expect(humanLine.closest('li')).toHaveTextContent('Ana Directora:')
    expect(humanLine.closest('li')).not.toHaveClass('italic')
  })
})
