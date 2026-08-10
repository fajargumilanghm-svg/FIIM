import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: { orgId: 'org', role: 'ORGANIZATION_ADMIN' } }),
}))
vi.mock('../../../services/api.service', () => ({
  default: {
    getAlgorithmConfig: vi.fn(),
    updateAlgorithmConfig: vi.fn(),
    getNotificationPreferences: vi.fn(),
    updateNotificationPreferences: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import SettingsPage from './SettingsPage'

const config = {
  acuteWindowDays: 7,
  chronicWindowDays: 21,
  veryLowThreshold: 0.8,
  lowThreshold: 1.0,
  moderateThreshold: 1.3,
  highThreshold: 1.5,
  enableAcwr: true,
  enableEWMA: false,
  ewmaConstant: 0.5,
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getAlgorithmConfig as any).mockResolvedValue(config)
  ;(apiService.updateAlgorithmConfig as any).mockResolvedValue(config)
  ;(apiService.getNotificationPreferences as any).mockResolvedValue({
    inApp: true,
    email: true,
    sms: false,
    push: false,
    quietHoursStart: null,
    quietHoursEnd: null,
  })
  ;(apiService.updateNotificationPreferences as any).mockResolvedValue({})
})

describe('SettingsPage', () => {
  it('renders the algorithm config form', async () => {
    render(<SettingsPage />)
    expect(await screen.findByText('Load Windows')).toBeInTheDocument()
    expect(screen.getByText('Risk Thresholds (ACWR)')).toBeInTheDocument()
  })

  it('saves configuration changes', async () => {
    render(<SettingsPage />)
    await screen.findByText('Load Windows')
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(apiService.updateAlgorithmConfig).toHaveBeenCalled())
  })

  it('validates strictly-increasing thresholds', async () => {
    render(<SettingsPage />)
    await screen.findByText('Load Windows')
    const highInput = screen.getByDisplayValue('1.5') as HTMLInputElement // High ceiling default
    fireEvent.change(highInput, { target: { value: '0.5' } }) // below moderate -> invalid
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(await screen.findByText(/Thresholds must strictly increase/i)).toBeInTheDocument()
    expect(apiService.updateAlgorithmConfig).not.toHaveBeenCalled()
  })
})
