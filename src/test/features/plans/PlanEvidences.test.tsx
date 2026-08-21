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
