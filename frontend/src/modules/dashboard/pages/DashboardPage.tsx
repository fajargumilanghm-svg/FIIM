import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  ArrowRight,
  Heart,
  BarChart3,
  Plus,
} from 'lucide-react'
import WellnessQuickEntry from '../components/WellnessQuickEntry'
import TrainingSessionQuickEntry from '../components/TrainingSessionQuickEntry'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [acwrData, setAcwrData] = useState<any[]>([])
  const [wellnessTrend, setWellnessTrend] = useState<any[]>([])
  const [injuryRisk, setInjuryRisk] = useState<any>(null)
  const [teamOverview, setTeamOverview] = useState<any[]>([])
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWellnessModal, setShowWellnessModal] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [user?.orgId])

  const loadDashboard = async () => {
    if (!user?.orgId) return
    
    setLoading(true)
    try {
      const [statsData, acwr, wellness, risk, teams, athletesData] = await Promise.all([
        apiService.client.get('/dashboard/overview', { params: { orgId: user.orgId } }).then(r => r.data),
        apiService.client.get('/dashboard/acwr-summary', { params: { orgId: user.orgId } }).then(r => r.data),
        apiService.client.get('/dashboard/wellness-trend', { params: { orgId: user.orgId } }).then(r => r.data),
        apiService.client.get('/dashboard/injury-risk', { params: { orgId: user.orgId } }).then(r => r.data),
        apiService.client.get('/dashboard/team-overview', { params: { orgId: user.orgId } }).then(r => r.data),
        apiService.getAthletes(user.orgId),
      ])
      
      setStats(statsData)
      setAcwrData(acwr)
      setWellnessTrend(wellness)
      setInjuryRisk(risk)
      setTeamOverview(teams)
      setAthletes(athletesData)
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Athletes',
      value: stats?.athletes?.total || 0,
      icon: Users,
      color: 'bg-fiim-sky',
      href: '/athletes',
    },
    {
      name: 'Active',
      value: stats?.athletes?.active || 0,
      icon: Activity,
      color: 'bg-fiim-emerald',
      href: '/athletes?status=ACTIVE',
    },
    {
      name: 'Injured',
      value: stats?.athletes?.injured || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/athletes?status=INJURED',
    },
    {
      name: 'At Risk',
      value: injuryRisk?.totalAtRisk || 0,
      icon: Shield,
      color: 'bg-fiim-amber',
      href: '/alerts',
    },
  ]

  const RISK_COLORS = {
    LOW: '#059669',
    MODERATE: '#d97706',
    HIGH: '#dc2626',
    VERY_HIGH: '#7f1d1d',
  }

  const pieData = injuryRisk?.distribution ? [
    { name: 'Low Risk', value: injuryRisk.distribution.LOW, color: RISK_COLORS.LOW },
    { name: 'Moderate', value: injuryRisk.distribution.MODERATE, color: RISK_COLORS.MODERATE },
    { name: 'High Risk', value: injuryRisk.distribution.HIGH, color: RISK_COLORS.HIGH },
    { name: 'Very High', value: injuryRisk.distribution.VERY_HIGH, color: RISK_COLORS.VERY_HIGH },
  ].filter(d => d.value > 0) : []

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fiim-slate">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Overview of your athletes, training load, and injury risks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrainingModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90"
          >
            <Plus className="h-4 w-4" />
            Training Session
          </button>
          <button
            onClick={() => setShowWellnessModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-fiim-emerald px-4 py-2 text-sm font-medium text-white hover:bg-fiim-emerald/90"
          >
            <Plus className="h-4 w-4" />
            Wellness Entry
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-fiim-sky/10 px-3 py-1.5 text-sm text-fiim-sky">
            <Heart className="h-4 w-4" />
            <span>{stats?.athletes?.healthy || 0} Healthy Athletes</span>
          </div>
        </div>
      </div>

      <WellnessQuickEntry
        isOpen={showWellnessModal}
        onClose={() => setShowWellnessModal(false)}
        athletes={athletes}
      />

      <TrainingSessionQuickEntry
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        athletes={athletes}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="group rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg ${stat.color} p-3 text-white`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-4 text-2xl font-bold text-fiim-slate">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ACWR Bar Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-fiim-slate">ACWR Summary</h3>
              <p className="text-sm text-muted-foreground">Acute:Chronic Workload Ratio by Athlete</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-emerald"></span> Safe</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fiim-amber"></span> Caution</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Danger</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acwrData.slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 2]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, _name: any, props: any) => [
                    `ACWR: ${value}`,
                    `${props.payload.position}`,
                  ]}
                />
                <Bar dataKey="acwr" radius={[4, 4, 0, 0]}>
                  {acwrData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.riskColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Injury Risk Pie Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-fiim-slate mb-1">Injury Risk</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {injuryRisk?.percentageAtRisk || 0}% at elevated risk
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-medium text-fiim-slate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wellness Trend & Team Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wellness Trend */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-fiim-slate">Wellness Trend</h3>
              <p className="text-sm text-muted-foreground">Daily average wellness scores (last 7 days)</p>
            </div>
            <div className="rounded-lg bg-fiim-emerald/10 p-2 text-fiim-emerald">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wellnessTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`Score: ${Number(value).toFixed(1)}`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#0284c7" 
                  strokeWidth={2}
                  dot={{ fill: '#0284c7', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Overview */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-fiim-slate">Team Overview</h3>
              <p className="text-sm text-muted-foreground">Active roster by team</p>
            </div>
            <div className="rounded-lg bg-fiim-sky/10 p-2 text-fiim-sky">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-4">
            {teamOverview.map((team: any) => (
              <div key={team.id} className="rounded-lg border border-fiim-coolgray p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-fiim-slate">{team.name}</h4>
                    <p className="text-xs text-muted-foreground">{team.sport?.name} • {team.category}</p>
                  </div>
                  <span className="rounded-full bg-fiim-coolgray px-2.5 py-1 text-xs font-medium text-fiim-slate">
                    {team.activeMembers}/{team.totalMembers} Active
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-fiim-emerald"></div>
                    <span className="text-muted-foreground">{team.activeMembers} Healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-muted-foreground">{team.injuredMembers} Injured</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Athletes Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-fiim-slate">Athletes at Risk</h3>
            <p className="text-sm text-muted-foreground">Athletes with elevated ACWR requiring attention</p>
          </div>
          <Link to="/athletes" className="text-sm font-medium text-fiim-sky hover:underline">
            View all athletes
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-fiim-coolgray/50">
              <tr>
                <th className="px-4 py-3 font-medium text-fiim-slate">Athlete</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">Position</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">ACWR</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">Acute Load</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">Chronic Load</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">Risk Level</th>
                <th className="px-4 py-3 font-medium text-fiim-slate">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {acwrData
                .filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH')
                .slice(0, 5)
                .map((athlete: any) => (
                <tr key={athlete.athleteId} className="hover:bg-fiim-coolgray/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-fiim-slate">{athlete.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{athlete.position || '—'}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: athlete.riskColor }}>
                    {athlete.acwr}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{athlete.acuteLoad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{athlete.chronicLoad}</td>
                  <td className="px-4 py-3">
                    <span 
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ 
                        backgroundColor: athlete.riskColor + '20',
                        color: athlete.riskColor 
                      }}
                    >
                      {athlete.riskLevel.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs ${athlete.trend === 'increasing' ? 'text-red-500' : 'text-fiim-emerald'}`}>
                      <TrendingUp className={`h-3 w-3 ${athlete.trend === 'increasing' ? 'rotate-0' : ''}`} />
                      {athlete.trend}
                    </span>
                  </td>
                </tr>
              ))}
              {acwrData.filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH').length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No athletes currently at elevated risk. Great job!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
