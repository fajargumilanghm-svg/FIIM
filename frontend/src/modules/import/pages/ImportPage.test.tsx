import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'COACH' } }),
}))
vi.mock('../../../services/api.service', () => ({
  default: { previewWellnessImport: vi.fn(), importWellness: vi.fn() },
}))

import apiService from '../../../services/api.service'
import ImportPage from './ImportPage'

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.previewWellnessImport as any).mockResolvedValue({
    totalRows: 2,
    validCount: 1,
    invalidCount: 1,
    rows: [
      { line: 2, data: { athleteId: 'a1', surveyDate: '2026-07-01' }, errors: [] },
      { line: 3, data: { athleteId: '', surveyDate: 'bad' }, errors: ['athleteId is required'] },
    ],
  })
  ;(apiService.importWellness as any).mockResolvedValue({ imported: 1, skippedInvalid: 1, failed: 0 })
})

describe('ImportPage', () => {
  it('previews pasted CSV and shows valid/invalid counts', async () => {
    render(<ImportPage />)
    fireEvent.change(screen.getByPlaceholderText(/athleteId,surveyDate/), {
      target: { value: 'athleteId,surveyDate\na1,2026-07-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(await screen.findByText('1 valid')).toBeInTheDocument()
    expect(screen.getByText('1 invalid')).toBeInTheDocument()
  })

  it('imports the valid rows after previewing', async () => {
    render(<ImportPage />)
    fireEvent.change(screen.getByPlaceholderText(/athleteId,surveyDate/), {
      target: { value: 'athleteId,surveyDate\na1,2026-07-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preview/i }))
    await screen.findByText('1 valid')
    fireEvent.click(screen.getByRole('button', { name: /import 1 valid rows/i }))
    await waitFor(() => expect(apiService.importWellness).toHaveBeenCalled())
    expect(await screen.findByText(/Imported/)).toBeInTheDocument()
  })
})
