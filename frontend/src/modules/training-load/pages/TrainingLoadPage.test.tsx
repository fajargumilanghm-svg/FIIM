import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'COACH' } }),
}))
vi.mock('../../../services/api.service', () => ({
  default: {
    getTrainingSessions: vi.fn(),
    getAthletes: vi.fn(),
    getAthleteLoadHistory: vi.fn(),
    getCalcTeamSummary: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import TrainingLoadPage from './TrainingLoadPage'

const session = {
  id: 's1',
  name: 'Morning Session',
  sessionType: 'TRAINING',
  scheduledDate: '2026-07-20',
  durationMinutes: 90,
  plannedRpe: 6,
  status: 'COMPLETED',
  sport: null,
  team: null,
  athleteLoads: [
    { id: 'l1', rpeScore: 7, durationMinutes: 60, totalLoad: 420, athlete: { id: 'a1', firstName: 'A', lastName: 'B' } },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getTrainingSessions as any).mockResolvedValue([session])
  ;(apiService.getAthletes as any).mockResolvedValue([{ id: 'a1', firstName: 'A', lastName: 'B' }])
  ;(apiService.getAthleteLoadHistory as any).mockResolvedValue([
    { session: { scheduledDate: '2026-07-20' }, createdAt: '2026-07-20', totalLoad: 420, rpeScore: 7 },
  ])
  ;(apiService.getCalcTeamSummary as any).mockResolvedValue({
    athletes: [
      {
        athleteId: 'a1',
        name: 'A B',
        position: 'MID',
        weeklyLoad: 2950,
        monotony: 2.4,
        strain: 7080,
        monotonyRisk: 'HIGH',
      },
    ],
  })
})

describe('TrainingLoadPage', () => {
  it('renders sessions and load stats', async () => {
    render(<TrainingLoadPage />)
    expect(await screen.findByText('Morning Session')).toBeInTheDocument()
    expect(screen.getByText('Training Load')).toBeInTheDocument()
  })

  it('expands a session to show athlete loads', async () => {
    render(<TrainingLoadPage />)
    fireEvent.click(await screen.findByText('Morning Session'))
    // The expanded per-athlete table has a unique "Duration" column header.
    expect(await screen.findByText('Duration')).toBeInTheDocument()
  })

  it('renders the monotony & strain panel with risk badge', async () => {
    render(<TrainingLoadPage />)
    expect(await screen.findByText(/Monotony & Strain/i)).toBeInTheDocument()
    expect(await screen.findByText('7,080')).toBeInTheDocument() // strain
    expect(await screen.findByText('HIGH')).toBeInTheDocument() // risk badge
  })
})
