import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'ORGANIZATION_ADMIN' } }),
}))

vi.mock('../../../services/api.service', () => ({
  default: {
    getAlerts: vi.fn(),
    getAlertStats: vi.fn(),
    generateAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import AlertsPage from './AlertsPage'

const stats = { open: 2, acknowledged: 1, resolved: 5, active: 3, critical: 1, warning: 1 }
const alert = {
  id: 'al1',
  type: 'ACWR_VERY_HIGH',
  severity: 'CRITICAL',
  status: 'OPEN',
  title: 'Extreme injury-risk load',
  message: 'A B has an ACWR of 1.9',
  metricValue: 1.9,
  riskLevel: 'VERY_HIGH',
  triggeredOn: '2026-07-27',
  athlete: { firstName: 'A', lastName: 'B', position: { name: 'FW' } },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <AlertsPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getAlerts as any).mockResolvedValue([alert])
  ;(apiService.getAlertStats as any).mockResolvedValue(stats)
  ;(apiService.generateAlerts as any).mockResolvedValue({})
  ;(apiService.acknowledgeAlert as any).mockResolvedValue({})
})

describe('AlertsPage', () => {
  it('loads and renders alerts with stats', async () => {
    renderPage()
    expect(await screen.findByText('Extreme injury-risk load')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(apiService.getAlerts).toHaveBeenCalledWith('org', { status: 'OPEN' })
  })

  it('runs a risk scan when the button is clicked', async () => {
    renderPage()
    await screen.findByText('Extreme injury-risk load')
    fireEvent.click(screen.getByRole('button', { name: /run risk scan/i }))
    await waitFor(() => expect(apiService.generateAlerts).toHaveBeenCalledWith('org'))
  })

  it('acknowledges an alert', async () => {
    renderPage()
    await screen.findByText('Extreme injury-risk load')
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }))
    await waitFor(() => expect(apiService.acknowledgeAlert).toHaveBeenCalledWith('al1', 'org'))
  })

  it('switches the status filter', async () => {
    renderPage()
    await screen.findByText('Extreme injury-risk load')
    fireEvent.click(screen.getByRole('button', { name: 'Resolved' }))
    await waitFor(() => expect(apiService.getAlerts).toHaveBeenCalledWith('org', { status: 'RESOLVED' }))
  })
})
