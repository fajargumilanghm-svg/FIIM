import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const login = vi.fn()
const authState = { current: { login, mfaRequired: false, isLoading: false } as any }

vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: () => authState.current,
}))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => vi.fn(),
}))

import LoginPage from './LoginPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
  authState.current = { login, mfaRequired: false, isLoading: false }
  login.mockResolvedValue(undefined)
})

describe('LoginPage', () => {
  it('submits email + password to login', async () => {
    renderPage()
    fireEvent.change(screen.getByPlaceholderText('coach@elitesports.local'), {
      target: { value: 'a@b.c' },
    })
    fireEvent.change(screen.getByPlaceholderText('password123'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@b.c', 'secret', undefined))
  })

  it('shows the MFA code field when MFA is required', () => {
    authState.current = { login, mfaRequired: true, isLoading: false }
    renderPage()
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
  })
})
