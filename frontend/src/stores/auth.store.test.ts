import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'

vi.mock('../services/api.service', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

import apiService from '../services/api.service'

const reset = () =>
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    mfaRequired: false,
    tempUserId: null,
  })

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: { id: 'u1', email: 'a@b.c', role: 'COACH' },
}

beforeEach(() => {
  reset()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('auth.store login', () => {
  it('stores tokens and user on success', async () => {
    ;(apiService.login as any).mockResolvedValue(session)
    await useAuthStore.getState().login('a@b.c', 'pw')
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(true)
    expect(s.user).toEqual(session.user)
    expect(localStorage.getItem('fiim_access_token')).toBe('access')
  })

  it('enters MFA-required state without authenticating', async () => {
    ;(apiService.login as any).mockResolvedValue({ mfaRequired: true, userId: 'u1' })
    await useAuthStore.getState().login('a@b.c', 'pw')
    const s = useAuthStore.getState()
    expect(s.mfaRequired).toBe(true)
    expect(s.tempUserId).toBe('u1')
    expect(s.isAuthenticated).toBe(false)
  })

  it('resets loading and rethrows on error', async () => {
    ;(apiService.login as any).mockRejectedValue(new Error('bad creds'))
    await expect(useAuthStore.getState().login('a@b.c', 'pw')).rejects.toThrow('bad creds')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})

describe('auth.store register', () => {
  it('authenticates on success', async () => {
    ;(apiService.register as any).mockResolvedValue(session)
    await useAuthStore.getState().register({ email: 'a@b.c', password: 'p', firstName: 'A', lastName: 'B' })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('rethrows on failure', async () => {
    ;(apiService.register as any).mockRejectedValue(new Error('dup'))
    await expect(
      useAuthStore.getState().register({ email: 'a@b.c', password: 'p', firstName: 'A', lastName: 'B' }),
    ).rejects.toThrow('dup')
  })
})

describe('auth.store logout', () => {
  it('calls the API when a refresh token exists and clears state', async () => {
    useAuthStore.setState({ refreshToken: 'refresh', isAuthenticated: true })
    ;(apiService.logout as any).mockResolvedValue({})
    await useAuthStore.getState().logout()
    expect(apiService.logout).toHaveBeenCalledWith('refresh')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('swallows API errors during logout', async () => {
    useAuthStore.setState({ refreshToken: 'refresh' })
    ;(apiService.logout as any).mockRejectedValue(new Error('network'))
    await expect(useAuthStore.getState().logout()).resolves.toBeUndefined()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('skips the API call when there is no refresh token', async () => {
    await useAuthStore.getState().logout()
    expect(apiService.logout).not.toHaveBeenCalled()
  })
})

describe('auth.store setUser / clearAuth', () => {
  it('setUser marks authenticated', () => {
    useAuthStore.getState().setUser({ id: 'u1' } as any)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('clearAuth wipes tokens and state', () => {
    useAuthStore.setState({ user: { id: 'u1' } as any, isAuthenticated: true, tempUserId: 'u1' })
    localStorage.setItem('fiim_access_token', 'x')
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().tempUserId).toBeNull()
    expect(localStorage.getItem('fiim_access_token')).toBeNull()
  })
})
