import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { SettingsList } from '@/features/admin/components/SettingsList'
import { PeriodsList } from '@/features/periods/components/admin/PeriodsList'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The two admin tables that sit outside the faculty/department/program family:
 * the institutional settings and the academic periods.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const SETTINGS = [
  {
    id: 5,
    key: 'plan.umbral',
    value: '3.5',
    value_type: 'number',
    description: 'Promedio bajo el cual se sugiere un plan',
    department_id: null,
    department_name: null,
    changed_by: 'Ada Lovelace',
    created_at: '2028-01-10T00:00:00Z',
    updated_at: '2028-01-10T00:00:00Z',
  },
]

const PERIODS = [
  {
    id: 4,
    code: '2028-1',
    name: '2028-1',
    start_date: '2028-01-15',
    end_date: '2028-06-15',
    evaluation_end_date: null,
    final_evaluation_date: null,
    active: true,
    created_at: '2028-01-01T00:00:00Z',
    updated_at: '2028-01-01T00:00:00Z',
  },
]

function page(rows: unknown[]) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages: 1, limit: 10 } }
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/settings')) return Promise.resolve(page(SETTINGS))
    if (url.includes('academic-periods')) return Promise.resolve(page(PERIODS))

    return Promise.resolve(page([]))
  })

  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: undefined })
})

async function openRowMenu(user: ReturnType<typeof userEvent.setup>, rowText: string) {
  const row = (await screen.findByText(rowText)).closest('tr')!
  await user.click(within(row).getByRole('button', { name: 'Acciones' }))
}

describe('SettingsList', () => {
  it('lists the settings with their current value', async () => {
    renderRouted(<SettingsList />)

    expect(await screen.findByText('plan.umbral')).toBeInTheDocument()
    expect(screen.getByText('Promedio bajo el cual se sugiere un plan')).toBeInTheDocument()
  })

  it('edits a setting, recording why it changed', async () => {
    const user = userEvent.setup()

    renderRouted(<SettingsList />)
    await openRowMenu(user, 'plan.umbral')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    const value = await screen.findByLabelText(/Valor/)
    await user.clear(value)
    await user.type(value, '3.8')

    // The audit trail is the point of this screen: a value never changes
    // without a stated reason.
    await user.type(await screen.findByLabelText(/Motivo del cambio/), 'Acuerdo de consejo')

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Guardar|Actualizar/ }),
    )

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/settings/5',
        expect.objectContaining({ value: '3.8', change_reason: 'Acuerdo de consejo' }),
      ),
    )
  })

  it('asks before deleting a setting', async () => {
    const user = userEvent.setup()

    renderRouted(<SettingsList />)
    await openRowMenu(user, 'plan.umbral')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    expect(mockApi.delete).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Eliminar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/settings/5'))
  })

  it('opens the change history of a setting', async () => {
    const user = userEvent.setup()

    renderRouted(<SettingsList />)
    await openRowMenu(user, 'plan.umbral')
    await user.click(await screen.findByRole('menuitem', { name: 'Historial' }))

    await waitFor(() =>
      expect(mockApi.get.mock.calls.some(([url]) => String(url) === '/settings/5/history')).toBe(
        true,
      ),
    )
  })
})

describe('PeriodsList', () => {
  it('lists the academic periods', async () => {
    renderRouted(<PeriodsList />)

    expect(await screen.findByText('2028-1')).toBeInTheDocument()
  })

  it('edits a period', async () => {
    const user = userEvent.setup()

    renderRouted(<PeriodsList />)
    await openRowMenu(user, '2028-1')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    const name = await screen.findByLabelText(/Nombre del periodo/)
    await user.clear(name)
    await user.type(name, '2028-I')

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /Guardar|Actualizar/ }),
    )

    await waitFor(() =>
      expect(mockApi.put).toHaveBeenCalledWith(
        '/academic-periods/4',
        expect.objectContaining({ name: '2028-I' }),
      ),
    )
  })

  it('asks before deleting a period', async () => {
    const user = userEvent.setup()

    renderRouted(<PeriodsList />)
    await openRowMenu(user, '2028-1')
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /Eliminar/ }))

    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/academic-periods/4'))
  })
})
