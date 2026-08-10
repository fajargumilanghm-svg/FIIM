import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
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

const CHART_TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: 'var(--shadow-md)',
  fontSize: '12px',
}

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
        apiService.client.get('/dashboard/overview', { params: { orgId: user.orgId } }).then((r) => r.data),
        apiService.client.get('/dashboard/acwr-summary', { params: { orgId: user.orgId } }).then((r) => r.data),
        apiService.client.get('/dashboard/wellness-trend', { params: { orgId: user.orgId } }).then((r) => r.data),
        apiService.client.get('/dashboard/injury-risk', { params: { orgId: user.orgId } }).then((r) => r.data),
        apiService.client.get('/dashboard/team-overview', { params: { orgId: user.orgId } }).then((r) => r.data),
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
    { name: 'Total Athletes', value: stats?.athletes?.total || 0, icon: Users, tone: 'primary' as const, href: '/athletes' },
    { name: 'Active', value: stats?.athletes?.active || 0, icon: Activity, tone: 'success' as const, href: '/athletes?status=ACTIVE' },
    { name: 'Injured', value: stats?.athletes?.injured || 0, icon: AlertTriangle, tone: 'danger' as const, href: '/athletes?status=INJURED' },
    { name: 'At Risk', value: injuryRisk?.totalAtRisk || 0, icon: Shield, tone: 'warning' as const, href: '/alerts' },
  ]

  const RISK_COLORS = { LOW: '#059669', MODERATE: '#d97706', HIGH: '#dc2626', VERY_HIGH: '#7f1d1d' }

  const pieData = injuryRisk?.distribution
    ? [
        { name: 'Low Risk', value: injuryRisk.distribution.LOW, color: RISK_COLORS.LOW },
        { name: 'Moderate', value: injuryRisk.distribution.MODERATE, color: RISK_COLORS.MODERATE },
        { name: 'High Risk', value: injuryRisk.distribution.HIGH, color: RISK_COLORS.HIGH },
        { name: 'Very High', value: injuryRisk.distribution.VERY_HIGH, color: RISK_COLORS.VERY_HIGH },
      ].filter((d) => d.value > 0)
    : []

  const riskBadgeVariant = (level: string) =>
    level === 'VERY_HIGH' || level === 'HIGH' ? 'danger' : level === 'MODERATE' ? 'warning' : 'success'

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const highRisk = acwrData.filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your athletes, training load, and injury risks"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowTrainingModal(true)}>
              <Plus /> Training Session
            </Button>
            <Button variant="success" size="sm" onClick={() => setShowWellnessModal(true)}>
              <Plus /> Wellness Entry
            </Button>
            <Badge variant="primary" className="hidden px-3 py-1.5 sm:inline-flex">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              {stats?.athletes?.healthy || 0} Healthy
            </Badge>
          </>
        }
      />

      <WellnessQuickEntry isOpen={showWellnessModal} onClose={() => setShowWellnessModal(false)} athletes={athletes} />
      <TrainingSessionQuickEntry isOpen={showTrainingModal} onClose={() => setShowTrainingModal(false)} athletes={athletes} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.name} label={stat.name} value={stat.value} icon={stat.icon} tone={stat.tone} href={stat.href} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ACWR */}
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">ACWR Summary</h3>
              <p className="text-sm text-muted-foreground">Acute:Chronic Workload Ratio by athlete</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Safe</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /> Caution</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Danger</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acwrData.slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-45} textAnchor="end" height={60} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 2]} stroke="hsl(var(--border))" />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: any, _name: any, props: any) => [`ACWR: ${value}`, `${props.payload.position}`]}
                />
                <Bar dataKey="acwr" radius={[4, 4, 0, 0]}>
                  {acwrData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.riskColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Injury risk pie */}
        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Injury Risk</h3>
          <p className="mb-4 text-sm text-muted-foreground">{injuryRisk?.percentageAtRisk || 0}% at elevated risk</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-medium tabular-nums text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Wellness trend + team overview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Wellness Trend</h3>
              <p className="text-sm text-muted-foreground">Daily average wellness (last 7 days)</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wellnessTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 10]} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: any) => [`Score: ${Number(value).toFixed(1)}`, '']} />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Team Overview</h3>
              <p className="text-sm text-muted-foreground">Active roster by team</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <div className="space-y-3">
            {teamOverview.map((team: any) => (
              <div key={team.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{team.name}</h4>
                    <p className="text-xs text-muted-foreground">{team.sport?.name} • {team.category}</p>
                  </div>
                  <Badge>{team.activeMembers}/{team.totalMembers} Active</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> {team.activeMembers} Healthy</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> {team.injuredMembers} Injured</span>
                </div>
              </div>
            ))}
            {teamOverview.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No teams yet.</p>}
          </div>
        </Card>
      </div>

      {/* At-risk table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5 sm:p-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Athletes at Risk</h3>
            <p className="text-sm text-muted-foreground">Elevated ACWR requiring attention</p>
          </div>
          <Link to="/athletes" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Athlete</th>
                <th scope="col" className="px-5 py-3 font-medium">Position</th>
                <th scope="col" className="px-5 py-3 font-medium">ACWR</th>
                <th scope="col" className="px-5 py-3 font-medium">Acute</th>
                <th scope="col" className="px-5 py-3 font-medium">Chronic</th>
                <th scope="col" className="px-5 py-3 font-medium">Risk</th>
                <th scope="col" className="px-5 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {highRisk.slice(0, 5).map((athlete: any) => (
                <tr key={athlete.athleteId} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium text-foreground">{athlete.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{athlete.position || '—'}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums" style={{ color: athlete.riskColor }}>{athlete.acwr}</td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{athlete.acuteLoad}</td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{athlete.chronicLoad}</td>
                  <td className="px-5 py-3">
                    <Badge variant={riskBadgeVariant(athlete.riskLevel)}>{athlete.riskLevel.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${athlete.trend === 'increasing' ? 'text-destructive' : 'text-success'}`}>
                      {athlete.trend === 'increasing' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {athlete.trend}
                    </span>
                  </td>
                </tr>
              ))}
              {highRisk.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No athletes currently at elevated risk. Great job!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
