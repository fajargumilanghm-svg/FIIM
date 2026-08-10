import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Field, Select } from '../../../components/ui/Field'
import {
  Heart,
  Moon,
  Zap,
  Frown,
  Brain,
  Droplets,
  Apple,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

const METRIC_ICONS: Record<string, any> = {
  sleepQuality: Moon,
  fatigueLevel: Zap,
  mood: Frown,
  stressLevel: Brain,
  muscleSoreness: Heart,
  hydration: Droplets,
  nutrition: Apple,
}

const METRIC_LABELS: Record<string, string> = {
  sleepQuality: 'Sleep Quality',
  fatigueLevel: 'Fatigue',
  mood: 'Mood',
  stressLevel: 'Stress',
  muscleSoreness: 'Soreness',
  hydration: 'Hydration',
  nutrition: 'Nutrition',
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: 'var(--shadow-md)',
  fontSize: '12px',
}

export default function WellnessPage() {
  const { user } = useAuthStore()
  const [surveys, setSurveys] = useState<any[]>([])
  const [teamAverage, setTeamAverage] = useState<any[]>([])
  const [athletes, setAthletes] = useState<any[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<string>('')
  const [athleteTrend, setAthleteTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null)

  useEffect(() => {
    loadWellnessData()
  }, [user?.orgId])

  useEffect(() => {
    if (selectedAthlete) {
      loadAthleteTrend(selectedAthlete)
    }
  }, [selectedAthlete])

  const loadWellnessData = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const [surveysData, teamData, athletesData] = await Promise.all([
        apiService.client.get('/wellness', { params: { orgId: user.orgId, dateFrom: '2026-07-01' } }).then((r) => r.data),
        apiService.client.get('/wellness/team-average', { params: { orgId: user.orgId, dateFrom: '2026-07-01' } }).then((r) => r.data),
        apiService.getAthletes(user.orgId),
      ])
      setSurveys(surveysData)
      setTeamAverage(teamData)
      setAthletes(athletesData)
      if (athletesData.length > 0 && !selectedAthlete) {
        setSelectedAthlete(athletesData[0].id)
      }
    } catch (error) {
      console.error('Wellness load error:', error)
      toast.error('Failed to load wellness data.')
    } finally {
      setLoading(false)
    }
  }

  const loadAthleteTrend = async (athleteId: string) => {
    try {
      const data = await apiService.client
        .get(`/wellness/trend/${athleteId}`, { params: { orgId: user?.orgId, days: 14 } })
        .then((r) => r.data)
      setAthleteTrend(data)
    } catch (error) {
      console.error('Athlete trend error:', error)
    }
  }

  const latestSurvey = surveys[0]
  const radarData = latestSurvey
    ? [
        { metric: 'Sleep', value: latestSurvey.sleepQuality || 0, fullMark: 10 },
        { metric: 'Fatigue', value: latestSurvey.fatigueLevel || 0, fullMark: 10 },
        { metric: 'Mood', value: latestSurvey.mood || 0, fullMark: 10 },
        { metric: 'Stress', value: latestSurvey.stressLevel || 0, fullMark: 10 },
        { metric: 'Soreness', value: latestSurvey.muscleSoreness || 0, fullMark: 10 },
        { metric: 'Hydration', value: latestSurvey.hydration || 0, fullMark: 10 },
        { metric: 'Nutrition', value: latestSurvey.nutrition || 0, fullMark: 10 },
      ]
    : []

  const scoreVariant = (score: number) => (score >= 7 ? 'success' : score >= 5 ? 'warning' : 'danger')
  const scoreLabel = (score: number) => (score >= 7 ? 'Good' : score >= 5 ? 'Fair' : 'Poor')

  const stats = [
    { label: 'Total Entries', value: surveys.length, icon: Heart, tone: 'bg-success/10 text-success' },
    { label: 'Latest Score', value: latestSurvey?.wellnessScore?.toFixed(1) || '—', icon: TrendingUp, tone: 'bg-primary/10 text-primary' },
    { label: 'Athletes', value: athletes.length, icon: Calendar, tone: 'bg-warning/10 text-warning' },
    {
      label: 'Responses Today',
      value: teamAverage.length > 0 ? teamAverage[teamAverage.length - 1].responseCount : 0,
      icon: Zap,
      tone: 'bg-primary/10 text-primary',
    },
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Wellness Surveys" description="Monitor athlete wellness, recovery, and readiness" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Team Wellness Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamAverage} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 10]} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="wellnessScore" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sleepQuality" stroke="hsl(var(--success))" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="fatigueLevel" stroke="hsl(var(--warning))" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Wellness</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Sleep</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Fatigue</span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <Field label="Select Athlete" htmlFor="wellness-athlete" className="mb-4">
            <Select id="wellness-athlete" value={selectedAthlete} onChange={(e) => setSelectedAthlete(e.target.value)}>
              {athletes.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </option>
              ))}
            </Select>
          </Field>

          {latestSurvey ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Wellness" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No wellness data available</div>
          )}
        </Card>
      </div>

      {/* Athlete trend */}
      <Card className="p-5 sm:p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Athlete Wellness Trend (14d)</h3>
        {athleteTrend.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No trend data for this athlete yet</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={athleteTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 10]} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="wellnessScore" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fatigueLevel" stroke="hsl(var(--warning))" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="muscleSoreness" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Wellness</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Fatigue</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Soreness</span>
        </div>
      </Card>

      {/* Recent surveys */}
      <Card className="overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Recent Wellness Entries</h3>
        </div>
        <div className="divide-y divide-border">
          {surveys.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No wellness surveys yet. Use the Wellness Entry button on the dashboard.
            </div>
          ) : (
            surveys.map((survey: any) => {
              const expanded = expandedSurvey === survey.id
              return (
                <div key={survey.id} className="p-4">
                  <button
                    onClick={() => setExpandedSurvey(expanded ? null : survey.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between rounded-lg text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {survey.athlete?.firstName?.[0]}
                        {survey.athlete?.lastName?.[0]}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">
                          {survey.athlete?.firstName} {survey.athlete?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(survey.surveyDate).toLocaleDateString()} • Score: {survey.wellnessScore?.toFixed(1) || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={scoreVariant(survey.wellnessScore || 0)}>{scoreLabel(survey.wellnessScore || 0)}</Badge>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(METRIC_LABELS).map(([key, label]) => {
                        const value = survey[key]
                        const Icon = METRIC_ICONS[key]
                        if (value === null || value === undefined) return null
                        return (
                          <div key={key} className="rounded-lg border border-border bg-muted/40 p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                              {label}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(value / 10) * 100}%` }} />
                              </div>
                              <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
                            </div>
                          </div>
                        )
                      })}
                      {survey.notes && (
                        <div className="col-span-full rounded-lg border border-border bg-muted/40 p-3">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm text-foreground">{survey.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
