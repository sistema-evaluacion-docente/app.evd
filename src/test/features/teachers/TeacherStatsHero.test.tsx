import { describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeacherStatsHero } from '@/features/teachers/components/TeacherStatsHero'
import { renderRouted, screen } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

const authUser = { current: { teacher_id: 4, name: 'Ada Lovelace', avatar_url: '' } as
  | { teacher_id: number; name: string; avatar_url: string }
  | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: { user: typeof authUser.current }) => unknown) =>
    selector({ user: authUser.current }),
}))

const mockApi = vi.mocked(api)

const HISTORY = {
  items: [
    {
      evaluation_id: 9,
      period_id: 2,
      period_code: '2028-1',
      period_name: '2028-1',
      overall_average: 4.3,
      group_count: 2,
    },
    {
      evaluation_id: 8,
      period_id: 1,
      period_code: '2027-2',
      period_name: '2027-2',
      overall_average: 3.9,
      group_count: 2,
    },
  ],
  total: 2,
  page: 1,
  pages: 1,
  limit: 50,
}

const DETAIL = {
  teacher_id: 4,
  institutional_code: 'A1',
  name: 'Ada Lovelace',
  avatar_url: '',
  contract_type: 'TIEMPO COMPLETO',
  evaluation_id: 9,
  period_code: '2028-1',
  period_name: '2028-1',
  overall_average: 4.3,
  group_count: 2,
  courses: [],
  dimensions: [],
}

function mockEndpoints({ history = HISTORY } = {}) {
  mockApi.get.mockImplementation((url: string) => {
    if (url === '/teachers/4/history') return Promise.resolve({ data: history })
    if (url === '/evaluations/teachers/4/detail') return Promise.resolve({ data: DETAIL })

    return Promise.resolve({ data: null })
  })
}

describe('TeacherStatsHero', () => {
  it('renders nothing without a teacher to show', () => {
    authUser.current = null
    mockEndpoints()

    const { container } = renderRouted(<TeacherStatsHero />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the teacher has no evaluated period yet', async () => {
    authUser.current = { teacher_id: 4, name: 'Ada Lovelace', avatar_url: '' }
    mockEndpoints({ history: { ...HISTORY, items: [] } })

    const { container } = renderRouted(<TeacherStatsHero />)

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('shows the latest period, the teacher and the compared average', async () => {
    authUser.current = { teacher_id: 4, name: 'Ada Lovelace', avatar_url: '' }
    mockEndpoints()

    renderRouted(<TeacherStatsHero />)

    expect(await screen.findByText('2028-1')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(await screen.findByText('A1')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver evaluación detallada' }),
    ).toHaveAttribute('href', '/periodos/2028-1')
  })

  it('honors an explicit teacherId over the authenticated one', async () => {
    authUser.current = { teacher_id: 4, name: 'Ada Lovelace', avatar_url: '' }
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/teachers/12/history') return Promise.resolve({ data: HISTORY })
      if (url === '/evaluations/teachers/12/detail') return Promise.resolve({ data: DETAIL })
      return Promise.resolve({ data: null })
    })

    renderRouted(<TeacherStatsHero teacherId={12} />)

    await screen.findByText('2028-1')
    expect(mockApi.get).toHaveBeenCalledWith('/teachers/12/history', expect.any(Object))
  })
})
