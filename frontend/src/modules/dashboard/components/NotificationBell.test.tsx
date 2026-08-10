import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../../services/api.service', () => ({
  default: {
    getUnreadNotificationCount: vi.fn(),
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}))

import apiService from '../../../services/api.service'
import NotificationBell from './NotificationBell'

beforeEach(() => {
  vi.clearAllMocks()
  ;(apiService.getUnreadNotificationCount as any).mockResolvedValue({ unread: 2 })
  ;(apiService.getNotifications as any).mockResolvedValue([
    {
      id: 'n1',
      type: 'ALERT',
      severity: 'CRITICAL',
      title: 'Extreme load',
      body: 'ACWR 1.7',
      readAt: null,
      createdAt: '2026-08-05T08:00:00Z',
    },
  ])
  ;(apiService.markAllNotificationsRead as any).mockResolvedValue({ updated: 2 })
  ;(apiService.markNotificationRead as any).mockResolvedValue({})
})

describe('NotificationBell', () => {
  it('shows the unread badge count', async () => {
    render(<NotificationBell />)
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('opens the dropdown and lists notifications', async () => {
    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Notifications'))
    expect(await screen.findByText('Extreme load')).toBeInTheDocument()
    expect(screen.getByText('ACWR 1.7')).toBeInTheDocument()
  })

  it('marks all as read', async () => {
    render(<NotificationBell />)
    fireEvent.click(screen.getByLabelText('Notifications'))
    await screen.findByText('Extreme load')
    fireEvent.click(screen.getByText(/mark all read/i))
    await waitFor(() => expect(apiService.markAllNotificationsRead).toHaveBeenCalled())
  })
})
