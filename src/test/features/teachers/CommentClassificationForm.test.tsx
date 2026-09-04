import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { CommentClassificationForm } from '@/features/teachers/components/CommentClassificationForm'
import type { TeacherComment } from '@/features/teachers/types'
import { renderWithProviders as render, screen, waitFor } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { patch: vi.fn() } }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

const COMMENT: TeacherComment = {
  id: 5,
  teacher_id: 4,
  evaluation_id: 9,
  academic_groups_id: 1,
  group_name: 'A',
  teacher_name: 'Ada Lovelace',
  teacher_avatar_url: '',
  course_name: 'Cálculo I',
  original_text: 'Falta mucho a clase',
  risk_level: { id: 2, name: 'Medio', color_hex: '#f59e0b' },
  risk_score: 0.6,
  pedagogical_categories: [
    { id: 2, name: 'LABEL_1', description: '', color_hex: '#7c3aed', score: 0.7 },
  ],
  created_at: '2028-02-01T00:00:00Z',
  updated_at: '2028-02-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.patch.mockResolvedValue({ data: COMMENT })
})

describe('CommentClassificationForm', () => {
  it('seeds the risk level and categories from the comment', () => {
    render(<CommentClassificationForm comment={COMMENT} />)

    expect(screen.getByText('Medio')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Desempeño docente' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Desarrollo del conocimiento' })).not.toBeChecked()
  })

  it('keeps save disabled until something actually changes', async () => {
    const user = userEvent.setup()
    render(<CommentClassificationForm comment={COMMENT} />)

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Desarrollo del conocimiento' }))

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  })

  it('saves the new risk level and category selection', async () => {
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<CommentClassificationForm comment={COMMENT} onSaved={onSaved} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Alto' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith('/comments/5', {
        risk_level: 3,
        pedagogical_category_ids: [2],
      }),
    )
    expect(onSaved).toHaveBeenCalled()
  })

  it('refuses to save with every category unchecked, even though something changed', async () => {
    const user = userEvent.setup()
    render(<CommentClassificationForm comment={COMMENT} />)

    await user.click(screen.getByRole('checkbox', { name: 'Desempeño docente' }))
    const save = screen.getByRole('button', { name: 'Guardar' })
    expect(save).toBeEnabled()

    await user.click(save)

    expect(mockApi.patch).not.toHaveBeenCalled()
  })
})
