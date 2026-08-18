import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useDeleteSignedDocument,
  useDownloadDocument,
  useDownloadDocumentWord,
  useDownloadSignedDocument,
  usePreviewSignedDocument,
  useUploadSignedDocument,
} from '@/features/plans/api'
import { PlanDocuments } from '@/features/plans/components/PlanDocuments'
import type { Plan, PlanCheckpoint, PlanDocument } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useDeleteSignedDocument: vi.fn(),
  useDownloadDocument: vi.fn(),
  useDownloadDocumentWord: vi.fn(),
  useDownloadSignedDocument: vi.fn(),
  usePreviewSignedDocument: vi.fn(),
  useUploadSignedDocument: vi.fn(),
}))

function checkpoint(
  id: number,
  stage: PlanCheckpoint['stage'],
  note?: string,
): PlanCheckpoint {
  return {
    id,
    plan_id: 7,
    stage,
    scheduled_date: null,
    completed_at: null,
    status: 'PENDIENTE',
    notes: null,
    aspect_notes: note ? [{ id: id * 10, aspect: 1, note }] : [],
  }
}

function planDocument(overrides: Partial<PlanDocument> = {}): PlanDocument {
  return {
    id: 1,
    plan_id: 7,
    format_type: 'FORMATO_3',
    generated_at: null,
    generated_by: null,
    signed_at: null,
    signed_by: null,
    signed_filename: null,
    has_generated: false,
    has_signed: false,
    ...overrides,
  }
}

/** A plan whose acta is filled in, which is what lets it be signed. */
function buildPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7,
    acta_status: 'BORRADOR',
    acta_locked: false,
    acta_number: '012',
    acta_date: '2026-03-03',
    items: [{ id: 1, commitment: 'Rediseñar las guías' }],
    documents: [],
    checkpoints: [
      checkpoint(11, 'PRIMER_SEGUIMIENTO'),
      checkpoint(12, 'SEGUNDO_SEGUIMIENTO'),
    ],
    ...overrides,
  } as unknown as Plan
}

const mutations = () => ({ mutate: vi.fn(), isPending: false })

beforeEach(() => {
  for (const hook of [
    useDeleteSignedDocument,
    useDownloadDocument,
    useDownloadDocumentWord,
    useDownloadSignedDocument,
    usePreviewSignedDocument,
    useUploadSignedDocument,
  ]) {
    vi.mocked(hook).mockReturnValue(mutations() as never)
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

/** The row of one of the three forms, found by the heading it carries. */
function rowOf(name: RegExp) {
  return screen.getByText(name).closest('li') as HTMLElement
}

describe('PlanDocuments', () => {
  it('never offers to generate or regenerate a form', () => {
    render(<PlanDocuments plan={buildPlan()} canManage />)

    expect(screen.queryByRole('button', { name: /Regenerar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Generar/ })).not.toBeInTheDocument()
  })

  it('puts both file types behind a single download button', async () => {
    const user = userEvent.setup()

    render(<PlanDocuments plan={buildPlan()} canManage />)

    const row = rowOf(/Formato 1/)

    expect(within(row).queryByRole('button', { name: /Word/ })).not.toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: /Descargar/ }))

    expect(await screen.findByRole('menuitem', { name: /Formato PDF/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Formato Word/ })).toBeInTheDocument()
  })

  it('downloads the form the system renders, not the signed scan', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()

    vi.mocked(useDownloadDocument).mockReturnValue({ mutate, isPending: false } as never)

    render(<PlanDocuments plan={buildPlan()} canManage />)

    await user.click(within(rowOf(/Formato 2/)).getByRole('button', { name: /Descargar/ }))
    await user.click(await screen.findByRole('menuitem', { name: /Formato PDF/ }))

    expect(mutate).toHaveBeenCalledWith('formato-2')
  })

  it('keeps the Word copy away from the teacher, who cannot fetch it', async () => {
    const user = userEvent.setup()

    render(<PlanDocuments plan={buildPlan()} canManage={false} />)

    await user.click(within(rowOf(/Formato 1/)).getByRole('button', { name: /Descargar/ }))

    expect(await screen.findByRole('menuitem', { name: /Formato PDF/ })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Formato Word/ })).not.toBeInTheDocument()
  })

  describe('the signed copy', () => {
    const signedPlan = () =>
      buildPlan({
        documents: [
          planDocument({
            format_type: 'FORMATO_3',
            signed_filename: 'acta-firmada-consejo.pdf',
            signed_at: '2026-05-04T10:00:00Z',
            has_generated: true,
            has_signed: true,
          }),
        ],
      })

    it('asks for it while there is none', () => {
      render(<PlanDocuments plan={buildPlan()} canManage />)

      expect(
        within(rowOf(/Formato 3/)).getByRole('button', { name: /Subir firmado/ }),
      ).toBeInTheDocument()
    })

    it('replaces the upload button with the file once it is attached', () => {
      render(<PlanDocuments plan={signedPlan()} canManage />)

      const row = rowOf(/Formato 3/)

      expect(within(row).queryByRole('button', { name: /Subir firmado/ })).not.toBeInTheDocument()
      expect(within(row).getByText('acta-firmada-consejo.pdf')).toBeInTheDocument()
      expect(
        within(row).getByRole('button', { name: /Descargar acta-firmada-consejo\.pdf/ }),
      ).toBeInTheDocument()
      expect(
        within(row).getByRole('button', { name: /Eliminar acta-firmada-consejo\.pdf/ }),
      ).toBeInTheDocument()
    })

    it('does not let the teacher remove it', () => {
      render(<PlanDocuments plan={signedPlan()} canManage={false} />)

      const row = rowOf(/Formato 3/)

      expect(within(row).getByText('acta-firmada-consejo.pdf')).toBeInTheDocument()
      expect(within(row).queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument()
    })

    it('names a copy signed before the API kept the file name', () => {
      const plan = buildPlan({
        documents: [planDocument({ has_generated: true, has_signed: true })],
      })

      render(<PlanDocuments plan={plan} canManage />)

      expect(within(rowOf(/Formato 3/)).getByText('formato-3_firmado.pdf')).toBeInTheDocument()
    })

    it('confirms before dropping it', async () => {
      const user = userEvent.setup()
      const mutate = vi.fn()

      vi.mocked(useDeleteSignedDocument).mockReturnValue({ mutate, isPending: false } as never)

      render(<PlanDocuments plan={signedPlan()} canManage />)

      await user.click(
        within(rowOf(/Formato 3/)).getByRole('button', {
          name: /Eliminar acta-firmada-consejo\.pdf/,
        }),
      )

      expect(await screen.findByText(/¿Eliminar el PDF firmado\?/)).toBeInTheDocument()
      expect(mutate).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: 'Eliminar' }))

      expect(mutate).toHaveBeenCalledWith('formato-3', expect.anything())
    })
  })

  describe('the Formato 3 badge', () => {
    it('stays quiet while no seguimiento has been recorded', () => {
      render(<PlanDocuments plan={buildPlan()} canManage />)

      expect(screen.queryByText(/Actualizado:/)).not.toBeInTheDocument()
    })

    it('says week 8 once the first seguimiento is saved', () => {
      const plan = buildPlan({
        checkpoints: [
          checkpoint(11, 'PRIMER_SEGUIMIENTO', 'Mejoró la puntualidad'),
          checkpoint(12, 'SEGUNDO_SEGUIMIENTO'),
        ],
      })

      render(<PlanDocuments plan={plan} canManage />)

      expect(within(rowOf(/Formato 3/)).getByText('Actualizado: Semana 8')).toBeInTheDocument()
    })

    it('moves to weeks 15/16 once the second one is saved', () => {
      const plan = buildPlan({
        checkpoints: [
          checkpoint(11, 'PRIMER_SEGUIMIENTO', 'Mejoró la puntualidad'),
          checkpoint(12, 'SEGUNDO_SEGUIMIENTO', 'Sostuvo el ritmo'),
        ],
      })

      render(<PlanDocuments plan={plan} canManage />)

      expect(within(rowOf(/Formato 3/)).getByText('Actualizado: Semanas 15/16')).toBeInTheDocument()
    })

    it('never labels the two static forms', () => {
      const plan = buildPlan({
        checkpoints: [
          checkpoint(11, 'PRIMER_SEGUIMIENTO', 'Mejoró la puntualidad'),
          checkpoint(12, 'SEGUNDO_SEGUIMIENTO'),
        ],
      })

      render(<PlanDocuments plan={plan} canManage />)

      expect(within(rowOf(/Formato 1/)).queryByText(/Actualizado:/)).not.toBeInTheDocument()
      expect(within(rowOf(/Formato 2/)).queryByText(/Actualizado:/)).not.toBeInTheDocument()
    })
  })
})

describe('PlanDocuments · el acuerdo se firma, no se cierra', () => {
  it('no ofrece cerrar ni reabrir el acta: la firma es lo que la congela', () => {
    render(<PlanDocuments plan={buildPlan()} canManage />)

    expect(screen.queryByRole('button', { name: /Cerrar acta/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reabrir acta/ })).not.toBeInTheDocument()
  })

  it('deja subir la ficha firmada con el acta en borrador', () => {
    render(<PlanDocuments plan={buildPlan()} canManage />)

    expect(within(rowOf(/Formato 2/)).getByRole('button', { name: /Subir firmado/ })).toBeEnabled()
  })

  it('no deja firmar un acta sin número, sin fecha ni compromisos, y dice qué falta', () => {
    render(
      <PlanDocuments
        plan={buildPlan({ acta_number: null, acta_date: null, items: [] })}
        canManage
      />,
    )

    const upload = within(rowOf(/Formato 2/)).getByRole('button', { name: /Subir firmado/ })

    expect(upload).toBeDisabled()
    expect(upload).toHaveAttribute(
      'title',
      'Antes de firmar el acta falta registrar el número del acta, la fecha del acta, al menos un compromiso',
    )
  })

  it('los otros formatos no dependen de los datos del acta', () => {
    render(
      <PlanDocuments
        plan={buildPlan({ acta_number: null, acta_date: null, items: [] })}
        canManage
      />,
    )

    expect(within(rowOf(/Formato 3/)).getByRole('button', { name: /Subir firmado/ })).toBeEnabled()
  })

  it('avisa de que el plan está en vigencia cuando el acuerdo ya está firmado', () => {
    render(<PlanDocuments plan={buildPlan({ acta_locked: true, acta_status: 'FIRMADA' })} canManage />)

    expect(screen.getByText(/el plan está en vigencia/)).toBeInTheDocument()
  })

  it('al quitar la ficha firmada avisa de que el plan vuelve a ser editable', async () => {
    const user = userEvent.setup()

    render(
      <PlanDocuments
        plan={buildPlan({
          acta_status: 'FIRMADA',
          acta_locked: true,
          documents: [
            planDocument({
              format_type: 'FORMATO_2',
              has_signed: true,
              signed_filename: 'acta-firmada-consejo.pdf',
            }),
          ],
        })}
        canManage
      />,
    )

    await user.click(
      within(rowOf(/Formato 2/)).getByRole('button', {
        name: /Eliminar acta-firmada-consejo\.pdf/,
      }),
    )

    expect(await screen.findByText(/podrás editar el plan de nuevo/)).toBeInTheDocument()
  })
})
