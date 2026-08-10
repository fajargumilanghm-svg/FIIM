import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  Download,
  Users,
  ShieldAlert,
  HeartPulse,
  Activity,
  FileText,
  FileDown,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react'

interface GeneratedReport {
  id: string
  type: string
  format: 'PDF' | 'CSV'
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  title: string
  createdAt: string
  fileSize: number | null
  error: string | null
}

interface ReportSchedule {
  id: string
  type: string
  format: 'PDF' | 'CSV'
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  recipients: string[]
  enabled: boolean
  nextRunAt: string | null
  lastRunAt: string | null
}

const STATUS_TINT: Record<string, string> = {
  COMPLETED: 'bg-fiim-emerald/10 text-fiim-emerald',
  GENERATING: 'bg-fiim-sky/10 text-fiim-sky',
  PENDING: 'bg-fiim-amber/10 text-fiim-amber',
  FAILED: 'bg-red-500/10 text-red-600',
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
  const canSchedule = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN'
  const [report, setReport] = useState<TeamSummary | null>(null)
  const [history, setHistory] = useState<GeneratedReport[]>([])
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    load()
  }, [user?.orgId])

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const [summary, hist, sched] = await Promise.all([
        apiService.getTeamSummaryReport(user.orgId),
        apiService.getReportHistory(user.orgId).catch(() => []),
        apiService.getReportSchedules(user.orgId).catch(() => []),
      ])
      setReport(summary)
      setHistory(hist)
      setSchedules(sched)
    } catch (e) {
      console.error('Report load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (format: 'pdf' | 'csv') => {
    if (!user?.orgId) return
    setGenerating(true)
    try {
      await apiService.generateTeamSummaryReport(user.orgId, format)
      setHistory(await apiService.getReportHistory(user.orgId))
    } catch (e) {
      console.error('Generate report error:', e)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = async (r: GeneratedReport) => {
    if (!user?.orgId) return
    try {
      const blob = await apiService.downloadReport(r.id, user.orgId)
      downloadBlob(blob, `${r.title}.${r.format.toLowerCase()}`)
    } catch (e) {
      console.error('Download report error:', e)
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-fiim-slate transition hover:bg-fiim-coolgray/50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Exporting…' : 'Export ACWR CSV'}
          </button>
          <button
            onClick={() => handleGenerate('pdf')}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {generating ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
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

      {/* Generated reports history */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-fiim-slate">Generated Reports</h3>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No reports generated yet. Use “Generate PDF” above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Format</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((r) => (
                  <tr key={r.id}>
                    <td className="p-4 font-medium text-fiim-slate">{r.title}</td>
                    <td className="p-4 text-muted-foreground">{r.format}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TINT[r.status] ?? 'bg-muted'}`}
                      >
                        {r.status}
                      </span>
                      {r.status === 'FAILED' && r.error ? (
                        <span className="ml-2 text-xs text-red-600">{r.error}</span>
                      ) : null}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleDownloadReport(r)}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50"
                        >
                          <FileDown className="h-3 w-3" /> Download
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled reports */}
      {canSchedule && (
        <ScheduledReports
          schedules={schedules}
          onChanged={async () => {
            if (user?.orgId) setSchedules(await apiService.getReportSchedules(user.orgId))
          }}
        />
      )}
    </div>
  )
}

function ScheduledReports({
  schedules,
  onChanged,
}: {
  schedules: ReportSchedule[]
  onChanged: () => Promise<void>
}) {
  const { user } = useAuthStore()
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY')
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!user?.orgId) return
    setBusy(true)
    try {
      await apiService.createReportSchedule(user.orgId, { frequency, format })
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!user?.orgId) return
    await apiService.deleteReportSchedule(id, user.orgId)
    await onChanged()
  }

  const toggle = async (s: ReportSchedule) => {
    if (!user?.orgId) return
    await apiService.updateReportSchedule(s.id, user.orgId, { enabled: !s.enabled })
    await onChanged()
  }

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-fiim-slate">Scheduled Reports</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
          </select>
          <button
            onClick={create}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-fiim-sky px-3 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add schedule
          </button>
        </div>
      </div>
      {schedules.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No scheduled reports.</div>
      ) : (
        <div className="divide-y">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fiim-sky/10 text-fiim-sky">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-fiim-slate">
                    {s.frequency.charAt(0) + s.frequency.slice(1).toLowerCase()} · {s.format}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.nextRunAt ? `Next: ${new Date(s.nextRunAt).toLocaleString()}` : 'Not scheduled'}
                    {s.lastRunAt ? ` · Last: ${new Date(s.lastRunAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.enabled ? 'bg-fiim-emerald/10 text-fiim-emerald' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.enabled ? 'Enabled' : 'Paused'}
                </button>
                <button
                  onClick={() => remove(s.id)}
                  aria-label="Delete schedule"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
