import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  Dumbbell,
  Activity,
  Timer,
  Gauge,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts'

interface AthleteLoad {
  id: string
  rpeScore: number | null
  durationMinutes: number | null
  totalLoad: number | null
  athlete?: { id: string; firstName: string; lastName: string; jerseyNumber?: number | null }
}

interface Session {
  id: string
  name: string
  sessionType: string
  scheduledDate: string
  durationMinutes: number | null
  plannedRpe: number | null
  status: string
  sport?: { name: string } | null
  team?: { name: string } | null
  athleteLoads: AthleteLoad[]
}

interface MonotonyRow {
  athleteId: string
  name: string
  position?: string | null
  weeklyLoad: number | null
  monotony: number | null
  strain: number | null
  monotonyRisk: string | null
}

export default function TrainingLoadPage() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [athletes, setAthletes] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<string>('')
  const [loadHistory, setLoadHistory] = useState<any[]>([])
  const [monotony, setMonotony] = useState<MonotonyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    loadMonotony()
  }, [user?.orgId])

  useEffect(() => {
    if (selectedAthlete) loadAthleteHistory(selectedAthlete)
  }, [selectedAthlete])

  const loadData = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const [sessionsData, athletesData] = await Promise.all([
        apiService.getTrainingSessions(user.orgId),
        apiService.getAthletes(user.orgId),
      ])
      setSessions(sessionsData)
      setAthletes(athletesData)
      if (athletesData.length > 0 && !selectedAthlete) {
        setSelectedAthlete(athletesData[0].id)
      }
    } catch (error) {
      console.error('Training load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMonotony = async () => {
    if (!user?.orgId) return
    try {
      const summary = await apiService.getCalcTeamSummary(user.orgId)
      const rows: MonotonyRow[] = (summary?.athletes ?? [])
        .filter((a: any) => a.monotony != null || a.weeklyLoad != null)
        .map((a: any) => ({
          athleteId: a.athleteId,
          name: a.name,
          position: a.position,
          weeklyLoad: a.weeklyLoad ?? null,
          monotony: a.monotony ?? null,
          strain: a.strain ?? null,
          monotonyRisk: a.monotonyRisk ?? null,
        }))
      setMonotony(rows)
    } catch (error) {
      console.error('Monotony summary error:', error)
    }
  }

  const loadAthleteHistory = async (athleteId: string) => {
    if (!user?.orgId) return
    try {
      const data = await apiService.getAthleteLoadHistory(athleteId, user.orgId, 30)
      // Reverse to chronological order for the chart
      const chartData = [...data]
        .reverse()
        .map((d: any) => ({
          date: d.session?.scheduledDate || d.createdAt,
          load: d.totalLoad || 0,
          rpe: d.rpeScore || 0,
        }))
      setLoadHistory(chartData)
    } catch (error) {
      console.error('Athlete history error:', error)
    }
  }

  // Aggregate stats across the loaded sessions
  const allLoads = sessions.flatMap((s) => s.athleteLoads)
  const totalLoad = allLoads.reduce((sum, l) => sum + (l.totalLoad || 0), 0)
  const rpeValues = allLoads.map((l) => l.rpeScore).filter((v): v is number => v != null)
  const avgRpe = rpeValues.length ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : 0

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-fiim-slate">Training Load</h2>
        <p className="text-muted-foreground">
          Track sessions, sRPE workload, and per-athlete load history
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={Dumbbell} tint="emerald" value={sessions.length} label="Sessions" />
        <StatCard icon={Activity} tint="sky" value={allLoads.length} label="Athlete Loads" />
        <StatCard icon={Gauge} tint="amber" value={avgRpe ? avgRpe.toFixed(1) : '—'} label="Avg RPE" />
        <StatCard
          icon={Timer}
          tint="purple"
          value={totalLoad.toLocaleString()}
          label="Total sRPE Load"
        />
      </div>

      {/* Athlete Load Trend */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-fiim-slate">Athlete Load History (30d)</h3>
          <select
            value={selectedAthlete}
            onChange={(e) => setSelectedAthlete(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            {athletes.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.firstName} {a.lastName}
              </option>
            ))}
          </select>
        </div>
        {loadHistory.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No load data for this athlete yet
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={loadHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar yAxisId="left" dataKey="load" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rpe"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-fiim-sky"></span> sRPE Load
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-fiim-amber"></span> RPE
          </span>
        </div>
      </div>

      {/* Monotony & Strain (Foster, 1998) */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-fiim-slate">Monotony &amp; Strain (7-day)</h3>
          <span className="text-xs text-muted-foreground">
            Monotony = mean ÷ SD of daily load · Strain = weekly load × monotony
          </span>
        </div>
        {monotony.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            No monotony data yet — log at least a week of sessions.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Athlete</th>
                  <th className="pb-2 font-medium">Weekly Load</th>
                  <th className="pb-2 font-medium">Monotony</th>
                  <th className="pb-2 font-medium">Strain</th>
                  <th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monotony.map((m) => (
                  <tr key={m.athleteId}>
                    <td className="py-2 text-fiim-slate">
                      {m.name}
                      {m.position ? (
                        <span className="ml-1 text-xs text-muted-foreground">· {m.position}</span>
                      ) : null}
                    </td>
                    <td className="py-2">{m.weeklyLoad?.toLocaleString() ?? '—'}</td>
                    <td className="py-2 font-medium text-fiim-slate">{m.monotony ?? '—'}</td>
                    <td className="py-2">{m.strain?.toLocaleString() ?? '—'}</td>
                    <td className="py-2">
                      <MonotonyBadge risk={m.monotonyRisk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-fiim-slate">Recent Sessions</h3>
        </div>
        <div className="divide-y">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No training sessions recorded yet.
            </div>
          ) : (
            sessions.map((session) => {
              const sessionLoad = session.athleteLoads.reduce(
                (sum, l) => sum + (l.totalLoad || 0),
                0,
              )
              return (
                <div key={session.id} className="p-4">
                  <button
                    onClick={() =>
                      setExpandedSession(expandedSession === session.id ? null : session.id)
                    }
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fiim-emerald/10 text-fiim-emerald">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-fiim-slate">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {new Date(session.scheduledDate).toLocaleDateString()} •{' '}
                          {session.sessionType} • {session.athleteLoads.length} athletes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-fiim-sky/10 px-2.5 py-1 text-xs font-medium text-fiim-sky">
                        {sessionLoad.toLocaleString()} AU
                      </span>
                      {expandedSession === session.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expandedSession === session.id && (
                    <div className="mt-4 overflow-x-auto">
                      {session.athleteLoads.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No athlete loads logged for this session.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-muted-foreground">
                              <th className="pb-2 font-medium">Athlete</th>
                              <th className="pb-2 font-medium">RPE</th>
                              <th className="pb-2 font-medium">Duration</th>
                              <th className="pb-2 font-medium">sRPE Load</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {session.athleteLoads.map((l) => (
                              <tr key={l.id}>
                                <td className="py-2 text-fiim-slate">
                                  {l.athlete?.firstName} {l.athlete?.lastName}
                                </td>
                                <td className="py-2">{l.rpeScore ?? '—'}</td>
                                <td className="py-2">
                                  {l.durationMinutes ? `${l.durationMinutes} min` : '—'}
                                </td>
                                <td className="py-2 font-medium text-fiim-slate">
                                  {l.totalLoad?.toLocaleString() ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function MonotonyBadge({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-muted-foreground">—</span>
  const styles: Record<string, string> = {
    NORMAL: 'bg-fiim-emerald/10 text-fiim-emerald',
    ELEVATED: 'bg-fiim-amber/10 text-fiim-amber',
    HIGH: 'bg-red-500/10 text-red-600',
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[risk] ?? 'bg-muted'}`}>
      {risk}
    </span>
  )
}

function StatCard({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: any
  tint: 'emerald' | 'sky' | 'amber' | 'purple'
  value: string | number
  label: string
}) {
  const tints: Record<string, string> = {
    emerald: 'bg-fiim-emerald/10 text-fiim-emerald',
    sky: 'bg-fiim-sky/10 text-fiim-sky',
    amber: 'bg-fiim-amber/10 text-fiim-amber',
    purple: 'bg-purple-500/10 text-purple-500',
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
