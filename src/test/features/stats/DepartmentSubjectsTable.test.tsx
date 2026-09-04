import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { DepartmentSubjectsTable } from '@/features/stats/components/DepartmentSubjectsTable'
import type { DepartmentSubjectAverage } from '@/features/stats/types'
import { renderRouted, screen, waitFor, within } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: { department_id: 3 } }),
}))

const mockApi = vi.mocked(api)

function page(rows: unknown[], pages = 1) {
  return { data: rows, pagination: { total: rows.length, page: 1, pages, limit: 10 } }
}

const SUBJECT: DepartmentSubjectAverage = {
  course_name: 'Cálculo I',
  course_codes: ['CAL'],
  teacher_count: 1,
  group_count: 1,
  overall_average: 4.2,
  total_respondents: 30,
  groups: [
    {
      academic_group_id: 1,
      group_name: 'A',
      course_id: 1,
      course_code: 'CAL',
      teacher_id: 7,
      teacher_name: 'Ada Lovelace',
      academic_period_id: 1,
      academic_period_code: '2028-1',
      overall_average: 4.2,
      respondent_count: 30,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url === '/stats/departments/period-range/subjects') return Promise.resolve(page([SUBJECT]))
    if (url === '/teachers/') return Promise.resolve(page([]))

    return Promise.resolve(page([]))
  })
})

describe('DepartmentSubjectsTable', () => {
  it('renders the subjects the endpoint answered', async () => {
    renderRouted(<DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" />)

    expect(await screen.findByText('Cálculo I')).toBeInTheDocument()
  })

  it('shows the empty message when there is nothing for the range', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/stats/departments/period-range/subjects') return Promise.resolve(page([]))
      return Promise.resolve(page([]))
    })

    renderRouted(
      <DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" emptyMessage="Nada por aquí." />,
    )

    expect(await screen.findByText('Nada por aquí.')).toBeInTheDocument()
  })

  it('expands a row to show its groups', async () => {
    const user = userEvent.setup()
    renderRouted(<DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" />)
    await screen.findByText('Cálculo I')

    await user.click(screen.getByRole('button', { name: /Cálculo I/ }))

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('2028-1')).toBeInTheDocument()
  })

  it('searches on the server as the query is typed', async () => {
    const user = userEvent.setup()
    renderRouted(<DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" />)
    await screen.findByText('Cálculo I')

    await user.type(screen.getByRole('textbox', { name: 'Buscar asignatura' }), 'calc')

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) =>
            url === '/stats/departments/period-range/subjects' &&
            config?.params?.search === 'calc',
        ),
      ).toBe(true),
    )
  })

  it('paginates when there is more than one page', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/stats/departments/period-range/subjects') return Promise.resolve(page([SUBJECT], 2))
      return Promise.resolve(page([]))
    })
    const user = userEvent.setup()
    renderRouted(<DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" />)
    await screen.findByText('Página 1 de 2')

    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(next)

    await waitFor(() =>
      expect(
        mockApi.get.mock.calls.some(
          ([url, config]) =>
            url === '/stats/departments/period-range/subjects' && config?.params?.page === 2,
        ),
      ).toBe(true),
    )
  })

  it('renders the optional title', async () => {
    renderRouted(
      <DepartmentSubjectsTable startPeriod="2027-1" endPeriod="2028-1" title="Asignaturas" />,
    )

    expect(screen.getByText('Asignaturas')).toBeInTheDocument()
  })
})
