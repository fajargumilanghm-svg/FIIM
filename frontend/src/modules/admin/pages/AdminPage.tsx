import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  Users,
  UserCog,
  ShieldCheck,
  Building2,
  Dumbbell,
  HeartPulse,
  Bell,
  Save,
  Check,
} from 'lucide-react'

interface Overview {
  users: { total: number; byRole: Record<string, number> }
  athletes: { total: number; byStatus: Record<string, number> }
  teams: number
  sports: number
  injuriesCurrentlyOut: number
  openAlerts: number
  wellnessSurveys: number
  trainingSessions: number
}

interface Org {
  name: string
  description: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  timezone: string
  currency: string
  gdprEnabled: boolean
  hipaaEnabled: boolean
  dataRetentionYears: number
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const canAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN'
  const [overview, setOverview] = useState<Overview | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (canAdmin) load()
    else setLoading(false)
  }, [user?.orgId])

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const [ov, o] = await Promise.all([
        apiService.getAdminOverview(user.orgId),
        apiService.getOrganization(user.orgId),
      ])
      setOverview(ov)
      setOrg(o)
    } catch (e: any) {
      if (e?.response?.status === 403) setForbidden(true)
      console.error('Admin load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const setOrgField = <K extends keyof Org>(key: K, value: Org[K]) => {
    setOrg((o) => (o ? { ...o, [key]: value } : o))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user?.orgId || !org) return
    setSaving(true)
    try {
      await apiService.updateOrganization(user.orgId, {
        name: org.name,
        description: org.description,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        website: org.website,
        timezone: org.timezone,
        currency: org.currency,
        gdprEnabled: org.gdprEnabled,
        hipaaEnabled: org.hipaaEnabled,
        dataRetentionYears: org.dataRetentionYears,
      })
      setSaved(true)
    } catch (e) {
      console.error('Org save error:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!canAdmin || forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-fiim-slate">Admins only</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          System administration is restricted to organization administrators.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-fiim-slate">Administration</h2>
        <p className="text-muted-foreground">Organization overview & compliance settings</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={Users} tint="sky" value={overview?.users.total ?? 0} label="Users" />
        <StatCard icon={UserCog} tint="emerald" value={overview?.athletes.total ?? 0} label="Athletes" />
        <StatCard icon={Dumbbell} tint="amber" value={overview?.trainingSessions ?? 0} label="Sessions" />
        <StatCard icon={Building2} tint="purple" value={overview?.teams ?? 0} label="Teams" />
        <StatCard icon={HeartPulse} tint="red" value={overview?.injuriesCurrentlyOut ?? 0} label="Injured" />
        <StatCard icon={Bell} tint="amber" value={overview?.openAlerts ?? 0} label="Open Alerts" />
        <StatCard icon={UserCog} tint="sky" value={overview?.wellnessSurveys ?? 0} label="Wellness" />
        <StatCard icon={Building2} tint="emerald" value={overview?.sports ?? 0} label="Sports" />
      </div>

      {/* Users by role */}
      {overview && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-fiim-slate">Users by Role</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(overview.users.byRole)
              .filter(([, count]) => count > 0)
              .map(([role, count]) => (
                <span
                  key={role}
                  className="rounded-full bg-fiim-coolgray/50 px-3 py-1 text-xs font-medium text-fiim-slate"
                >
                  {role.replace(/_/g, ' ').toLowerCase()}: {count}
                </span>
              ))}
            {Object.values(overview.users.byRole).every((c) => c === 0) && (
              <span className="text-sm text-muted-foreground">No users assigned yet.</span>
            )}
          </div>
        </div>
      )}

      {/* Organization settings */}
      {org && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-fiim-slate">Organization</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" value={org.name} onChange={(v) => setOrgField('name', v)} />
            <TextField
              label="Contact email"
              value={org.contactEmail ?? ''}
              onChange={(v) => setOrgField('contactEmail', v)}
            />
            <TextField
              label="Contact phone"
              value={org.contactPhone ?? ''}
              onChange={(v) => setOrgField('contactPhone', v)}
            />
            <TextField
              label="Website"
              value={org.website ?? ''}
              onChange={(v) => setOrgField('website', v)}
            />
            <TextField label="Timezone" value={org.timezone} onChange={(v) => setOrgField('timezone', v)} />
            <TextField label="Currency" value={org.currency} onChange={(v) => setOrgField('currency', v)} />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-fiim-slate">Compliance</p>
            <div className="space-y-3">
              <Toggle
                label="GDPR mode"
                checked={org.gdprEnabled}
                onChange={(v) => setOrgField('gdprEnabled', v)}
              />
              <Toggle
                label="HIPAA mode"
                checked={org.hipaaEnabled}
                onChange={(v) => setOrgField('hipaaEnabled', v)}
              />
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-fiim-slate">Data retention (years)</p>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={org.dataRetentionYears}
                  onChange={(e) => setOrgField('dataRetentionYears', parseInt(e.target.value))}
                  className="w-24 rounded-md border border-input px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-5 py-2.5 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium text-fiim-slate">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
      />
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-fiim-slate">{label}</p>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-fiim-sky' : 'bg-fiim-coolgray'
        }`}
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

function StatCard({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: any
  tint: 'red' | 'amber' | 'sky' | 'emerald' | 'purple'
  value: string | number
  label: string
}) {
  const tints: Record<string, string> = {
    red: 'bg-red-500/10 text-red-600',
    amber: 'bg-fiim-amber/10 text-fiim-amber',
    sky: 'bg-fiim-sky/10 text-fiim-sky',
    emerald: 'bg-fiim-emerald/10 text-fiim-emerald',
    purple: 'bg-purple-500/10 text-purple-600',
  }
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${tints[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-fiim-slate">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
