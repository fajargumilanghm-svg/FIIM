import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'ORGANIZATION_ADMIN' } }),
}))
vi.mock('../../../services/api.service', () => ({
  default: {
    getTeamSummaryReport: vi.fn(),
    downloadAthletesCsv: vi.fn(),
    getReportHistory: vi.fn(),
    getReportSchedules: vi.fn(),
    generateTeamSummaryReport: vi.fn(),
    downloadReport: vi.fn(),
    createReportSchedule: vi.fn(),
    updateReportSchedule: vi.fn(),
    deleteReportSchedule: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import ReportsPage from './ReportsPage'

const report = {
  generatedAt: '2026-07-27T00:00:00Z',
  roster: { total: 12 },
  injuryRisk: { atRiskCount: 1, atRiskPercentage: 8.3, riskDistribution: { HIGH: 1, MODERATE: 2 } },
  injuries: { currentlyOut: 2, totalDaysLost: 30, bySeverity: {} },
  wellness: { latestTeamScore: 7.2, dataPoints: 3 },
  atRiskAthletes: [{ name: 'A B', position: 'FW', acwr: 1.4, riskLevel: 'HIGH' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getTeamSummaryReport as any).mockResolvedValue(report)
  ;(apiService.downloadAthletesCsv as any).mockResolvedValue(new Blob(['csv']))
  ;(apiService.getReportHistory as any).mockResolvedValue([])
  ;(apiService.getReportSchedules as any).mockResolvedValue([])
  ;(apiService.generateTeamSummaryReport as any).mockResolvedValue({ id: 'r1', status: 'COMPLETED' })
  ;(apiService.downloadReport as any).mockResolvedValue(new Blob(['pdf']))
  ;(apiService.createReportSchedule as any).mockResolvedValue({})
  ;(apiService.deleteReportSchedule as any).mockResolvedValue({})
  // jsdom lacks URL.createObjectURL
  ;(URL as any).createObjectURL = vi.fn(() => 'blob:x')
  ;(URL as any).revokeObjectURL = vi.fn()
})

describe('ReportsPage', () => {
  it('renders the team summary report', async () => {
    render(<ReportsPage />)
    expect(await screen.findByText('At-Risk Athletes')).toBeInTheDocument()
    expect(screen.getByText('A B')).toBeInTheDocument()
    expect(screen.getByText('ACWR Risk Distribution')).toBeInTheDocument()
  })

  it('downloads the CSV export', async () => {
    render(<ReportsPage />)
    await screen.findByText('At-Risk Athletes')
    fireEvent.click(screen.getByRole('button', { name: /export acwr csv/i }))
    await waitFor(() => expect(apiService.downloadAthletesCsv).toHaveBeenCalledWith('org'))
  })

  it('generates a PDF report and refreshes history', async () => {
    render(<ReportsPage />)
    await screen.findByText('At-Risk Athletes')
    fireEvent.click(screen.getByRole('button', { name: /generate pdf/i }))
    await waitFor(() =>
      expect(apiService.generateTeamSummaryReport).toHaveBeenCalledWith('org', 'pdf'),
    )
  })

  it('lists a completed report and downloads it', async () => {
    ;(apiService.getReportHistory as any).mockResolvedValue([
      {
        id: 'r1',
        type: 'TEAM_SUMMARY',
        format: 'PDF',
        status: 'COMPLETED',
        title: 'Team Load Summary',
        createdAt: '2026-08-01T00:00:00Z',
        fileSize: 1234,
        error: null,
      },
    ])
    render(<ReportsPage />)
    expect(await screen.findByText('Team Load Summary')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /download/i }))
    await waitFor(() => expect(apiService.downloadReport).toHaveBeenCalledWith('r1', 'org'))
  })

  it('creates a scheduled report (admin)', async () => {
    render(<ReportsPage />)
    await screen.findByText('Scheduled Reports')
    fireEvent.click(screen.getByRole('button', { name: /add schedule/i }))
    await waitFor(() =>
      expect(apiService.createReportSchedule).toHaveBeenCalledWith('org', {
        frequency: 'WEEKLY',
        format: 'PDF',
      }),
    )
  })
})
