import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiService from '../services/api.service'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string | null
  avatarUrl: string | null
  role: string
  orgId: string | null
  orgName: string | null
  mfaEnabled: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  mfaRequired: boolean
  tempUserId: string | null

  // Actions
  login: (email: string, password: string, mfaCode?: string) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      tempUserId: null,

      login: async (email, password, mfaCode) => {
        set({ isLoading: true })
        try {
          const response = await apiService.login(email, password, mfaCode)
          
          if (response.mfaRequired) {
            set({
              mfaRequired: true,
              tempUserId: response.userId,
              isLoading: false,
            })
            return
          }

          localStorage.setItem('fiim_access_token', response.accessToken)
          localStorage.setItem('fiim_refresh_token', response.refreshToken)

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            mfaRequired: false,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await apiService.register(data)
          
          localStorage.setItem('fiim_access_token', response.accessToken)
          localStorage.setItem('fiim_refresh_token', response.refreshToken)

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        const refreshToken = get().refreshToken
        if (refreshToken) {
          try {
            await apiService.logout(refreshToken)
          } catch (error) {
            console.error('Logout error:', error)
          }
        }

        localStorage.removeItem('fiim_access_token')
        localStorage.removeItem('fiim_refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          mfaRequired: false,
        })
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('fiim_access_token')
        localStorage.removeItem('fiim_refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          mfaRequired: false,
          tempUserId: null,
        })
      },
    }),
    {
      name: 'fiim-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
