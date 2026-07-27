import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'MEDICAL_STAFF' } }),
}))
vi.mock('../../../services/api.service', () => ({
  default: {
    getInjuries: vi.fn(),
    getInjuryStats: vi.fn(),
    getAthletes: vi.fn(),
    updateInjury: vi.fn(),
    createInjury: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import InjuriesPage from './InjuriesPage'

const injury = {
  id: 'i1',
  bodyPart: 'Left hamstring',
  injuryType: 'Grade II strain',
  mechanism: 'NON_CONTACT',
  severity: 'MODERATE',
  status: 'OPEN',
  onsetDate: '2026-07-01',
  expectedReturnDate: null,
  daysLost: 10,
  athlete: { id: 'a1', firstName: 'A', lastName: 'B', position: { name: 'FW' } },
}
const stats = { total: 1, currentlyOut: 1, totalDaysLost: 10, byStatus: { RESOLVED: 0 }, bySeverity: {} }

const renderPage = () =>
  render(
    <MemoryRouter>
      <InjuriesPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getInjuries as any).mockResolvedValue([injury])
  ;(apiService.getInjuryStats as any).mockResolvedValue(stats)
  ;(apiService.getAthletes as any).mockResolvedValue([{ id: 'a1', firstName: 'A', lastName: 'B' }])
  ;(apiService.updateInjury as any).mockResolvedValue({})
  ;(apiService.createInjury as any).mockResolvedValue({})
})

describe('InjuriesPage', () => {
  it('renders injuries and stats', async () => {
    renderPage()
    expect(await screen.findByText(/Left hamstring/)).toBeInTheDocument()
    expect(screen.getByText('Injuries')).toBeInTheDocument()
  })

  it('advances an injury status through the return-to-play flow', async () => {
    renderPage()
    await screen.findByText(/Left hamstring/)
    // Two "Recovering" buttons exist: the filter tab and the row advance action.
    // The advance action is the second one.
    const recoveringButtons = screen.getAllByRole('button', { name: 'Recovering' })
    fireEvent.click(recoveringButtons[recoveringButtons.length - 1])
    await waitFor(() =>
      expect(apiService.updateInjury).toHaveBeenCalledWith('i1', 'org', { status: 'RECOVERING' }),
    )
  })

  it('opens the report-injury form', async () => {
    renderPage()
    await screen.findByText(/Left hamstring/)
    fireEvent.click(screen.getByRole('button', { name: /report injury/i }))
    expect(await screen.findByText('Report Injury')).toBeInTheDocument()
  })

  it('validates and submits a new injury from the form', async () => {
    renderPage()
    await screen.findByText(/Left hamstring/)
    fireEvent.click(screen.getByRole('button', { name: /report injury/i }))
    await screen.findByText('Report Injury')

    // Submitting without a body part surfaces a validation error.
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/body part.*are required/i)).toBeInTheDocument()
    expect(apiService.createInjury).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('e.g. Left hamstring'), {
      target: { value: 'Right calf' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(apiService.createInjury).toHaveBeenCalled())
    expect((apiService.createInjury as any).mock.calls[0][1]).toMatchObject({ bodyPart: 'Right calf' })
  })
})
