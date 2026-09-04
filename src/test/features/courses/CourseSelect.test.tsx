import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { CourseSelect } from '@/features/courses/components/CourseSelect'
import { renderRouted, screen, waitFor } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: { department_id: 3 } }),
}))

const mockApi = vi.mocked(api)

const COURSES = [
  { id: 1, code: 'CAL', name: 'Cálculo I', department_id: 3 },
  { id: 2, code: 'FIS', name: 'Física I', department_id: 3 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue({
    data: COURSES,
    pagination: { total: 2, page: 1, pages: 1, limit: 100 },
  })
})

describe('CourseSelect', () => {
  it('offers the department courses once opened', async () => {
    const user = userEvent.setup()
    renderRouted(<CourseSelect onValueChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox'))

    expect(await screen.findAllByRole('option')).toHaveLength(2)
    expect(
      mockApi.get.mock.calls.some(
        ([url, config]) => url === '/courses/' && config?.params?.department_id === 3,
      ),
    ).toBe(true)
  })

  it('reports the picked course id', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    renderRouted(<CourseSelect onValueChange={onValueChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /Cálculo I/ }))

    expect(onValueChange).toHaveBeenCalledWith(1)
  })

  it('shows the selected course by id', async () => {
    renderRouted(<CourseSelect value={2} onValueChange={vi.fn()} />)

    expect(await screen.findByDisplayValue('Física I')).toBeInTheDocument()
  })

  it('omits the department filter when scoped to every department', async () => {
    renderRouted(<CourseSelect departmentId={null} onValueChange={vi.fn()} />)

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    expect(
      mockApi.get.mock.calls.some(([, config]) => config?.params?.department_id !== undefined),
    ).toBe(false)
  })
})
