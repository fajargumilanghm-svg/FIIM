import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { Save, SlidersHorizontal, Check } from 'lucide-react'

interface AlgorithmConfig {
  acuteWindowDays: number
  chronicWindowDays: number
  veryLowThreshold: number
  lowThreshold: number
  moderateThreshold: number
  highThreshold: number
  enableAcwr: boolean
  enableEWMA: boolean
  ewmaConstant: number | null
}

const DEFAULTS: AlgorithmConfig = {
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

export default function SettingsPage() {
  const { user } = useAuthStore()
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN'
  const [config, setConfig] = useState<AlgorithmConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [user?.orgId])

  const loadConfig = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const data = await apiService.getAlgorithmConfig(user.orgId)
      setConfig({ ...DEFAULTS, ...data })
    } catch (e) {
      console.error('Config load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const set = <K extends keyof AlgorithmConfig>(key: K, value: AlgorithmConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }))
    setSaved(false)
  }

  const validate = (): string | null => {
    const { veryLowThreshold, lowThreshold, moderateThreshold, highThreshold } = config
    if (!(veryLowThreshold < lowThreshold && lowThreshold < moderateThreshold && moderateThreshold < highThreshold)) {
      return 'Thresholds must strictly increase: Very Low < Low < Moderate < High.'
    }
    if (config.acuteWindowDays >= config.chronicWindowDays) {
      return 'Acute window must be shorter than the chronic window.'
    }
    return null
  }

  const handleSave = async () => {
    if (!user?.orgId) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await apiService.updateAlgorithmConfig(user.orgId, config)
      setSaved(true)
    } catch (e) {
      setError('Failed to save configuration.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-fiim-slate">Settings</h2>
        <p className="text-muted-foreground">
          Configure the ACWR calculation engine for your organization
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-lg bg-fiim-amber/10 p-4 text-sm text-fiim-amber">
          You have read-only access. Only organization admins can change these values.
        </div>
      )}

      {/* Windows */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-fiim-sky" />
          <h3 className="text-lg font-semibold text-fiim-slate">Load Windows</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Acute window (days)"
            value={config.acuteWindowDays}
            onChange={(v) => set('acuteWindowDays', v)}
            min={1}
            max={14}
            disabled={!canEdit}
          />
          <NumberField
            label="Chronic window (days)"
            value={config.chronicWindowDays}
            onChange={(v) => set('chronicWindowDays', v)}
            min={7}
            max={42}
            disabled={!canEdit}
          />
        </div>
      </section>

      {/* Thresholds */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-lg font-semibold text-fiim-slate">Risk Thresholds (ACWR)</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Boundaries between risk zones. Values must strictly increase.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Very Low ceiling" value={config.veryLowThreshold} onChange={(v) => set('veryLowThreshold', v)} step={0.05} disabled={!canEdit} />
          <NumberField label="Low ceiling" value={config.lowThreshold} onChange={(v) => set('lowThreshold', v)} step={0.05} disabled={!canEdit} />
          <NumberField label="Moderate ceiling" value={config.moderateThreshold} onChange={(v) => set('moderateThreshold', v)} step={0.05} disabled={!canEdit} />
          <NumberField label="High ceiling" value={config.highThreshold} onChange={(v) => set('highThreshold', v)} step={0.05} disabled={!canEdit} />
        </div>

        {/* Zone preview */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-fiim-slate">Risk zones</p>
          <div className="flex overflow-hidden rounded-lg text-center text-xs font-medium text-white">
            <div className="flex-1 bg-fiim-sky py-2">Very Low<br />&lt;{config.veryLowThreshold}</div>
            <div className="flex-1 bg-fiim-emerald py-2">Low<br />{config.veryLowThreshold}–{config.lowThreshold}</div>
            <div className="flex-1 bg-fiim-amber py-2">Moderate<br />{config.lowThreshold}–{config.moderateThreshold}</div>
            <div className="flex-1 bg-red-500 py-2">High<br />{config.moderateThreshold}–{config.highThreshold}</div>
            <div className="flex-1 bg-red-900 py-2">Very High<br />≥{config.highThreshold}</div>
          </div>
        </div>
      </section>

      {/* Feature flags */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-fiim-slate">Algorithm Options</h3>
        <div className="space-y-4">
          <Toggle
            label="Enable ACWR"
            description="Acute:Chronic Workload Ratio calculation"
            checked={config.enableAcwr}
            onChange={(v) => set('enableAcwr', v)}
            disabled={!canEdit}
          />
          <Toggle
            label="Enable EWMA"
            description="Exponentially Weighted Moving Average (more responsive to recent load)"
            checked={config.enableEWMA}
            onChange={(v) => set('enableEWMA', v)}
            disabled={!canEdit}
          />
          {config.enableEWMA && (
            <NumberField
              label="EWMA constant (λ)"
              value={config.ewmaConstant ?? 0.5}
              onChange={(v) => set('ewmaConstant', v)}
              step={0.05}
              min={0.1}
              max={0.9}
              disabled={!canEdit}
            />
          )}
        </div>
      </section>

      {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}

      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-5 py-2.5 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-fiim-emerald">Configuration updated</span>}
        </div>
      )}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  disabled?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium text-fiim-slate">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm disabled:bg-fiim-coolgray/40 disabled:text-muted-foreground"
      />
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-fiim-slate">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? 'bg-fiim-sky' : 'bg-fiim-coolgray'
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
