import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUser = { current: { orgId: 'org', role: 'ORGANIZATION_ADMIN' } }
vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => ({ user: mockUser.current }),
}))
vi.mock('../../../services/api.service', () => ({
  default: { getAuditLogs: vi.fn(), getAuditStats: vi.fn() },
}))

import apiService from '../../../services/api.service'
import AuditPage from './AuditPage'

beforeEach(() => {
  vi.clearAllMocks()
  mockUser.current = { orgId: 'org', role: 'ORGANIZATION_ADMIN' }
  ;(apiService.getAuditLogs as any).mockResolvedValue({
    total: 1,
    items: [
      {
        id: 'l1',
        action: 'CREATE',
        entityType: 'injury',
        entityId: 'i1',
        description: 'Reported injury',
        containsMedicalData: true,
        createdAt: '2026-07-27T10:00:00Z',
        user: { firstName: 'A', lastName: 'B', email: 'a@b.c' },
      },
    ],
  })
})

describe('AuditPage', () => {
  it('renders audit entries for admins', async () => {
    render(<AuditPage />)
    expect(await screen.findByText('Audit Log')).toBeInTheDocument()
    expect(screen.getByText('Reported injury')).toBeInTheDocument()
    expect(screen.getByText('medical')).toBeInTheDocument()
  })

  it('shows an admins-only gate for non-admin roles', () => {
    mockUser.current = { orgId: 'org', role: 'COACH' } as any
    render(<AuditPage />)
    expect(screen.getByText('Admins only')).toBeInTheDocument()
    expect(apiService.getAuditLogs).not.toHaveBeenCalled()
  })
})
