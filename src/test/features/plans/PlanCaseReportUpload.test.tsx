import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PlanCaseReportUpload } from '@/features/plans/components/PlanCaseReportUpload'

function renderUpload() {
  const onFileChange = vi.fn()

  render(<PlanCaseReportUpload file={null} onFileChange={onFileChange} />)

  return { onFileChange }
}

/**
 * El Formato 1 es el único de los tres que la plataforma nunca dibuja: llega
 * del programa académico ya diligenciado y firmado. El director que no lo ha
 * visto nunca no tiene, sin esto, forma de saber qué se le está pidiendo.
 */
describe('PlanCaseReportUpload · reconocer el formato', () => {
  it('ofrece el formato en blanco para descargar', () => {
    renderUpload()

    const link = screen.getByRole('link', { name: /Descargar el formato en blanco/ })

    expect(link).toHaveAttribute('href', '/formato-1.pdf')
    // Sin `download` el navegador abre el PDF en la pestaña en vez de guardarlo.
    expect(link).toHaveAttribute('download')
  })

  it('explica de dónde sale el formato al pasar el cursor', async () => {
    const user = userEvent.setup()

    renderUpload()

    await user.hover(screen.getByRole('button', { name: /Qué es el Formato 1/ }))

    expect(
      await screen.findByText(/Lo diligencia y firma el director o coordinador del programa/),
    ).toBeVisible()
  })

  it('sigue diciendo que el docente no lo ve', () => {
    // El Formato 1 es material interno de la dirección, y esa es la línea que
    // decide si un director se anima a adjuntar una queja con nombres.
    renderUpload()

    expect(screen.getByText(/no se le muestra al docente/)).toBeInTheDocument()
  })
})
