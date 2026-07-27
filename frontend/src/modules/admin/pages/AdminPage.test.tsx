import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockUser = { current: { orgId: 'org', role: 'ORGANIZATION_ADMIN' } as any }
vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: mockUser.current }),
}))
vi.mock('../../../services/api.service', () => ({
  default: { getAdminOverview: vi.fn(), getOrganization: vi.fn(), updateOrganization: vi.fn() },
}))

import apiService from '../../../services/api.service'
import AdminPage from './AdminPage'

const overview = {
  users: { total: 5, byRole: { COACH: 2, ATHLETE: 3 } },
  athletes: { total: 3, byStatus: { ACTIVE: 3 } },
  teams: 1,
  sports: 1,
  injuriesCurrentlyOut: 0,
  openAlerts: 2,
  wellnessSurveys: 10,
  trainingSessions: 4,
}
const org = {
  name: 'FC Test',
  description: null,
  contactEmail: 'a@b.c',
  contactPhone: null,
  website: null,
  timezone: 'UTC',
  currency: 'USD',
  gdprEnabled: true,
  hipaaEnabled: false,
  dataRetentionYears: 7,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUser.current = { orgId: 'org', role: 'ORGANIZATION_ADMIN' }
  ;(apiService.getAdminOverview as any).mockResolvedValue(overview)
  ;(apiService.getOrganization as any).mockResolvedValue(org)
  ;(apiService.updateOrganization as any).mockResolvedValue(org)
})

describe('AdminPage', () => {
  it('renders overview and organization settings', async () => {
    render(<AdminPage />)
    expect(await screen.findByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Users by Role')).toBeInTheDocument()
    expect(screen.getByDisplayValue('FC Test')).toBeInTheDocument()
  })

  it('saves organization changes', async () => {
    render(<AdminPage />)
    await screen.findByText('Administration')
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(apiService.updateOrganization).toHaveBeenCalled())
  })

  it('gates non-admins', () => {
    mockUser.current = { orgId: 'org', role: 'COACH' }
    render(<AdminPage />)
    expect(screen.getByText('Admins only')).toBeInTheDocument()
  })
})
