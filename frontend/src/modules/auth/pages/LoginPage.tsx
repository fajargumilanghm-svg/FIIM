import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { Button } from '../../../components/ui/Button'
import { Field, Input } from '../../../components/ui/Field'
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react'

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
        // MFA is required, form will reveal the MFA field
      } else {
        setError(err.response?.data?.message || 'Invalid credentials')
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Subtle brand backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]"
      />

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">FIIM</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Fatigue Injury Index Monitoring</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Field label="Email address" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="coach@elitesports.local"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                  placeholder="password123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {mfaRequired && (
              <Field
                label="MFA Code"
                htmlFor="mfa"
                hint="Enter the 6-digit code from your authenticator app"
              >
                <Input
                  id="mfa"
                  type="text"
                  inputMode="numeric"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                />
              </Field>
            )}

            <Button type="submit" size="lg" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Demo accounts:{' '}
              <span className="font-mono text-primary">superadmin@fiim.local</span> /{' '}
              <span className="font-mono text-primary">coach@elitesports.local</span>
              <br />
              Password: <span className="font-mono text-primary">password123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">© 2024 FIIM. All rights reserved.</p>
      </div>
    </div>
  )
}
