import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { Activity, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, mfaRequired, isLoading } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password, mfaCode || undefined)
      
      if (!mfaRequired) {
        navigate('/')
      }
    } catch (err: any) {
      if (err.response?.data?.mfaRequired) {
        // MFA is required, form will show MFA field
      } else {
        setError(err.response?.data?.message || 'Invalid credentials')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fiim-coolgray px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-fiim-sky text-white">
            <Activity className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-fiim-slate">
            FIIM
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fatigue Injury Index Monitoring
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="coach@elitesports.local"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="password123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mfaRequired && (
              <div className="space-y-2">
                <label htmlFor="mfa" className="text-sm font-medium">
                  MFA Code
                </label>
                <input
                  id="mfa"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="000000"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-fiim-sky px-4 py-2.5 text-sm font-medium text-white hover:bg-fiim-sky/90 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Demo accounts:{' '}
              <span className="font-mono text-fiim-sky">superadmin@fiim.local</span>{' '}
              /{' '}
              <span className="font-mono text-fiim-sky">coach@elitesports.local</span>
              <br />
              Password: <span className="font-mono text-fiim-sky">password123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © 2024 FIIM. All rights reserved.
        </p>
      </div>
    </div>
  )
}
