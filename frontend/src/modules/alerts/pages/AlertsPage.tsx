import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  CheckCircle2,
  RefreshCw,
  Check,
} from 'lucide-react'

interface Alert {
  id: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  title: string
  message: string
  metricValue: number | null
  riskLevel: string | null
  triggeredOn: string
  athlete?: { firstName: string; lastName: string; position?: { name: string } | null }
}

interface AlertStats {
  open: number
  acknowledged: number
  resolved: number
  active: number
  critical: number
  warning: number
}

const STATUS_FILTERS = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'] as const

export default function AlertsPage() {
  const { user } = useAuthStore()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('OPEN')

  useEffect(() => {
    loadData()
  }, [user?.orgId, statusFilter])

  const loadData = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const params = statusFilter === 'ALL' ? {} : { status: statusFilter }
      const [alertsData, statsData] = await Promise.all([
        apiService.getAlerts(user.orgId, params),
        apiService.getAlertStats(user.orgId),
      ])
      setAlerts(alertsData)
      setStats(statsData)
    } catch (error) {
      console.error('Alerts load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!user?.orgId) return
    setGenerating(true)
    try {
      await apiService.generateAlerts(user.orgId)
      await loadData()
    } catch (error) {
      console.error('Generate alerts error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleAcknowledge = async (id: string) => {
    if (!user?.orgId) return
    await apiService.acknowledgeAlert(id, user.orgId)
    await loadData()
  }

  const handleResolve = async (id: string) => {
    if (!user?.orgId) return
    await apiService.resolveAlert(id, user.orgId)
    await loadData()
  }

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fiim-slate">Alerts</h2>
          <p className="text-muted-foreground">
            Injury-risk alerts raised from ACWR thresholds
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Scanning…' : 'Run risk scan'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={AlertOctagon} tint="red" value={stats?.critical ?? 0} label="Critical (active)" />
        <StatCard icon={AlertTriangle} tint="amber" value={stats?.warning ?? 0} label="Warning (active)" />
        <StatCard icon={BellRing} tint="sky" value={stats?.open ?? 0} label="Open" />
        <StatCard icon={CheckCircle2} tint="emerald" value={stats?.resolved ?? 0} label="Resolved" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === f
                ? 'bg-fiim-slate text-white'
                : 'bg-white text-fiim-slate shadow-sm hover:bg-fiim-coolgray/50'
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="divide-y">
          {alerts.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-fiim-emerald/60" />
              No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} alerts. Run a risk scan to
              refresh.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className={`rounded-lg p-3 ${severityTint(alert.severity)}`}>
                  {alert.severity === 'CRITICAL' ? (
                    <AlertOctagon className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-fiim-slate">{alert.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTint(alert.status)}`}>
                      {alert.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alert.athlete?.firstName} {alert.athlete?.lastName}
                    {alert.athlete?.position?.name ? ` • ${alert.athlete.position.name}` : ''} •{' '}
                    {new Date(alert.triggeredOn).toLocaleDateString()}
                  </p>
                </div>
                {alert.status !== 'RESOLVED' && (
                  <div className="flex items-center gap-2">
                    {alert.status === 'OPEN' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-fiim-emerald px-3 py-1.5 text-xs font-medium text-white hover:bg-fiim-emerald/90"
                    >
                      <Check className="h-3 w-3" /> Resolve
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function severityTint(severity: string) {
  if (severity === 'CRITICAL') return 'bg-red-500/10 text-red-600'
  if (severity === 'WARNING') return 'bg-fiim-amber/10 text-fiim-amber'
  return 'bg-fiim-sky/10 text-fiim-sky'
}

function statusTint(status: string) {
  if (status === 'OPEN') return 'bg-red-500/10 text-red-600'
  if (status === 'ACKNOWLEDGED') return 'bg-fiim-amber/10 text-fiim-amber'
  return 'bg-fiim-emerald/10 text-fiim-emerald'
}

function StatCard({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: any
  tint: 'red' | 'amber' | 'sky' | 'emerald'
  value: string | number
  label: string
}) {
  const tints: Record<string, string> = {
    red: 'bg-red-500/10 text-red-600',
    amber: 'bg-fiim-amber/10 text-fiim-amber',
    sky: 'bg-fiim-sky/10 text-fiim-sky',
    emerald: 'bg-fiim-emerald/10 text-fiim-emerald',
  }
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-3 ${tints[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-fiim-slate">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
