import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
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
        apiService.client.get('/wellness', { params: { orgId: user.orgId, dateFrom: '2026-07-01' } }).then(r => r.data),
        apiService.client.get('/wellness/team-average', { params: { orgId: user.orgId, dateFrom: '2026-07-01' } }).then(r => r.data),
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
    } finally {
      setLoading(false)
    }
  }

  const loadAthleteTrend = async (athleteId: string) => {
    try {
      const data = await apiService.client.get(`/wellness/trend/${athleteId}`, {
        params: { orgId: user?.orgId, days: 14 },
      }).then(r => r.data)
      setAthleteTrend(data)
    } catch (error) {
      console.error('Athlete trend error:', error)
    }
  }

  const latestSurvey = surveys[0]
  const radarData = latestSurvey ? [
    { metric: 'Sleep', value: latestSurvey.sleepQuality || 0, fullMark: 10 },
    { metric: 'Fatigue', value: latestSurvey.fatigueLevel || 0, fullMark: 10 },
    { metric: 'Mood', value: latestSurvey.mood || 0, fullMark: 10 },
    { metric: 'Stress', value: latestSurvey.stressLevel || 0, fullMark: 10 },
    { metric: 'Soreness', value: latestSurvey.muscleSoreness || 0, fullMark: 10 },
    { metric: 'Hydration', value: latestSurvey.hydration || 0, fullMark: 10 },
    { metric: 'Nutrition', value: latestSurvey.nutrition || 0, fullMark: 10 },
  ] : []

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
        <h2 className="text-2xl font-bold text-fiim-slate">Wellness Surveys</h2>
        <p className="text-muted-foreground">
          Monitor athlete wellness, recovery, and readiness
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-fiemerald/10 p-3 text-fiim-emerald">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fiim-slate">{surveys.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-fiim-sky/10 p-3 text-fiim-sky">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fiim-slate">
                {latestSurvey?.wellnessScore?.toFixed(1) || '—'}
              </p>
              <p className="text-sm text-muted-foreground">Latest Score</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-fiim-amber/10 p-3 text-fiim-amber">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fiim-slate">{athletes.length}</p>
              <p className="text-sm text-muted-foreground">Athletes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-3 text-purple-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-fiim-slate">
                {teamAverage.length > 0 ? teamAverage[teamAverage.length - 1].responseCount : 0}
              </p>
              <p className="text-sm text-muted-foreground">Responses Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Wellness Trend */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-fiim-slate mb-4">Team Wellness Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamAverage} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="wellnessScore" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sleepQuality" stroke="#059669" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="fatigueLevel" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-sky"></span> Wellness</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-emerald"></span> Sleep</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-amber"></span> Fatigue</span>
          </div>
        </div>

        {/* Athlete Radar Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label className="text-sm font-medium text-fiim-slate">Select Athlete</label>
            <select
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
            >
              {athletes.map((a: any) => (
                <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
              ))}
            </select>
          </div>
          
          {latestSurvey ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Wellness"
                    dataKey="value"
                    stroke="#0284c7"
                    fill="#0284c7"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No wellness data available
            </div>
          )}
        </div>
      </div>

      {/* Athlete Wellness Trend */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-fiim-slate">
          Athlete Wellness Trend (14d)
        </h3>
        {athleteTrend.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-muted-foreground">
            No trend data for this athlete yet
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={athleteTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line type="monotone" dataKey="wellnessScore" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fatigueLevel" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="muscleSoreness" stroke="#dc2626" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-sky"></span> Wellness</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-amber"></span> Fatigue</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Soreness</span>
        </div>
      </div>

      {/* Recent Surveys Table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-fiim-slate">Recent Wellness Entries</h3>
        </div>
        <div className="divide-y">
          {surveys.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No wellness surveys yet. Use the Wellness Entry button on the dashboard.
            </div>
          ) : (
            surveys.map((survey: any) => (
              <div key={survey.id} className="p-4">
                <button
                  onClick={() => setExpandedSurvey(expandedSurvey === survey.id ? null : survey.id)}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fiim-sky/10 text-fiim-sky font-bold text-sm">
                      {survey.athlete?.firstName?.[0]}{survey.athlete?.lastName?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-fiim-slate">
                        {survey.athlete?.firstName} {survey.athlete?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(survey.surveyDate).toLocaleDateString()} • Score: {survey.wellnessScore?.toFixed(1) || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      (survey.wellnessScore || 0) >= 7
                        ? 'bg-fiim-emerald/10 text-fiim-emerald'
                        : (survey.wellnessScore || 0) >= 5
                        ? 'bg-fiim-amber/10 text-fiim-amber'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {(survey.wellnessScore || 0) >= 7 ? 'Good' : (survey.wellnessScore || 0) >= 5 ? 'Fair' : 'Poor'}
                    </span>
                    {expandedSurvey === survey.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedSurvey === survey.id && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Object.entries(METRIC_LABELS).map(([key, label]) => {
                      const value = survey[key]
                      const Icon = METRIC_ICONS[key]
                      if (value === null || value === undefined) return null
                      return (
                        <div key={key} className="rounded-lg bg-fiim-coolgray/50 p-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-fiim-coolgray">
                              <div 
                                className="h-2 rounded-full bg-fiim-sky transition-all"
                                style={{ width: `${(value / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-fiim-slate">{value}</span>
                          </div>
                        </div>
                      )
                    })}
                    {survey.notes && (
                      <div className="col-span-full rounded-lg bg-fiim-coolgray/50 p-3">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm text-fiim-slate">{survey.notes}</p>
                      </div>
                    )}
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
