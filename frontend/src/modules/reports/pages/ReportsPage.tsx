import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { Download, Users, ShieldAlert, HeartPulse, Activity } from 'lucide-react'

interface TeamSummary {
  generatedAt: string
  roster: { total: number }
  injuryRisk: {
    atRiskCount: number
    atRiskPercentage: number
    riskDistribution: Record<string, number>
  }
  injuries: { currentlyOut: number; totalDaysLost: number; bySeverity: Record<string, number> }
  wellness: { latestTeamScore: number | null; dataPoints: number }
  atRiskAthletes: { name: string; position: string | null; acwr: number | null; riskLevel: string }[]
}

const RISK_COLORS: Record<string, string> = {
  VERY_LOW: '#0284c7',
  LOW: '#059669',
  MODERATE: '#d97706',
  HIGH: '#dc2626',
  VERY_HIGH: '#7f1d1d',
  INSUFFICIENT_DATA: '#6b7280',
}

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [report, setReport] = useState<TeamSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    load()
  }, [user?.orgId])

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      setReport(await apiService.getTeamSummaryReport(user.orgId))
    } catch (e) {
      console.error('Report load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!user?.orgId) return
    setDownloading(true)
    try {
      const blob = await apiService.downloadAthletesCsv(user.orgId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'fiim-athletes-acwr.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('CSV export error:', e)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const dist = report?.injuryRisk.riskDistribution ?? {}
  const distTotal = Object.values(dist).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fiim-slate">Reports</h2>
          <p className="text-muted-foreground">
            Team summary
            {report ? ` • generated ${new Date(report.generatedAt).toLocaleString()}` : ''}
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Exporting…' : 'Export ACWR CSV'}
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={Users} tint="sky" value={report?.roster.total ?? 0} label="Athletes" />
        <StatCard
          icon={ShieldAlert}
          tint="red"
          value={`${report?.injuryRisk.atRiskCount ?? 0} (${report?.injuryRisk.atRiskPercentage ?? 0}%)`}
          label="At-risk (ACWR)"
        />
        <StatCard icon={HeartPulse} tint="amber" value={report?.injuries.currentlyOut ?? 0} label="Currently Injured" />
        <StatCard
          icon={Activity}
          tint="emerald"
          value={report?.wellness.latestTeamScore?.toFixed(1) ?? '—'}
          label="Team Wellness"
        />
      </div>

      {/* Risk distribution bar */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-fiim-slate">ACWR Risk Distribution</h3>
        {distTotal === 0 ? (
          <p className="text-sm text-muted-foreground">No ACWR calculations available yet.</p>
        ) : (
          <>
            <div className="flex h-6 overflow-hidden rounded-full">
              {Object.entries(dist).map(([level, count]) =>
                count > 0 ? (
                  <div
                    key={level}
                    style={{ width: `${(count / distTotal) * 100}%`, backgroundColor: RISK_COLORS[level] }}
                    title={`${level}: ${count}`}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {Object.entries(dist).map(([level, count]) => (
                <span key={level} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[level] }} />
                  {level.replace('_', ' ')}: {count}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* At-risk athletes table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-fiim-slate">At-Risk Athletes</h3>
        </div>
        {report && report.atRiskAthletes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Athlete</th>
                  <th className="p-4 font-medium">Position</th>
                  <th className="p-4 font-medium">ACWR</th>
                  <th className="p-4 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.atRiskAthletes.map((a, i) => (
                  <tr key={i}>
                    <td className="p-4 font-medium text-fiim-slate">{a.name}</td>
                    <td className="p-4 text-muted-foreground">{a.position ?? '—'}</td>
                    <td className="p-4">{a.acwr ?? '—'}</td>
                    <td className="p-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: RISK_COLORS[a.riskLevel] }}
                      >
                        {a.riskLevel.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No athletes currently in the HIGH or VERY_HIGH risk zone.
          </div>
        )}
      </div>
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
          <p className="text-xl font-bold text-fiim-slate">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
