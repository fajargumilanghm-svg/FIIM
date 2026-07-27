import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Phone,
  Mail,
  Ruler,
  Weight,
  AlertCircle,
  Activity,
  User,
} from 'lucide-react'

export default function AthleteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [athlete, setAthlete] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && user?.orgId) {
      loadAthlete()
    }
  }, [id, user?.orgId])

  const loadAthlete = async () => {
    try {
      const data = await apiService.getAthlete(id!, user!.orgId!)
      setAthlete(data)
    } catch (error) {
      console.error('Failed to load athlete:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-fiim-slate">Athlete not found</h3>
        <button
          onClick={() => navigate('/athletes')}
          className="mt-4 text-fiim-sky hover:underline"
        >
          Back to athletes
        </button>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-fiim-emerald/10 text-fiim-emerald',
    INJURED: 'bg-red-500/10 text-red-500',
    RETURNING_TO_PLAY: 'bg-fiim-amber/10 text-fiim-amber',
    RETIRED: 'bg-gray-500/10 text-gray-500',
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/athletes')}
            className="rounded-md p-2 text-muted-foreground hover:bg-fiim-coolgray"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-fiim-slate">
                {athlete.firstName} {athlete.lastName}
              </h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[athlete.status] || 'bg-gray-500/10 text-gray-500'}`}>
                {athlete.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-muted-foreground">
              {athlete.sport?.name}
              {athlete.position?.name && ` • ${athlete.position.name}`}
              {athlete.jerseyNumber && ` • #${athlete.jerseyNumber}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/athletes/${id}/edit`)}
          className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium text-fiim-slate hover:bg-fiim-coolgray"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* Profile Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-fiim-slate mb-4">Profile Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={athlete.email} />
              <InfoItem icon={Phone} label="Phone" value={athlete.phone} />
              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={athlete.dateOfBirth ? new Date(athlete.dateOfBirth).toLocaleDateString() : '—'}
              />
              <InfoItem icon={User} label="Gender" value={athlete.gender} />
              <InfoItem icon={Ruler} label="Height" value={athlete.heightCm ? `${athlete.heightCm} cm` : '—'} />
              <InfoItem icon={Weight} label="Weight" value={athlete.weightKg ? `${athlete.weightKg} kg` : '—'} />
              <InfoItem icon={Activity} label="Nationality" value={athlete.nationality} />
              <InfoItem
                icon={Calendar}
                label="Joined"
                value={athlete.joinedDate ? new Date(athlete.joinedDate).toLocaleDateString() : '—'}
              />
            </div>
          </div>

          {athlete.injuryStatus && (
            <div className="rounded-xl bg-red-50 p-6 shadow-sm border border-red-100">
              <h3 className="text-lg font-semibold text-red-700 mb-2">Current Injury</h3>
              <p className="text-red-600">{athlete.injuryStatus}</p>
              {athlete.returnToPlayDate && (
                <p className="mt-2 text-sm text-red-500">
                  Expected return: {new Date(athlete.returnToPlayDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {athlete.notes && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-fiim-slate mb-2">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{athlete.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-fiim-slate mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-fiim-slate">{athlete.emergencyContactName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-fiim-slate">{athlete.emergencyContactPhone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium text-fiim-slate">{athlete.emergencyContactRelation || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-fiim-slate mb-4">Teams</h3>
            {athlete.teams?.length > 0 ? (
              <div className="space-y-2">
                {athlete.teams.map((tm: any) => (
                  <div key={tm.id} className="rounded-lg bg-fiim-coolgray/50 p-3">
                    <p className="font-medium text-fiim-slate">{tm.team.name}</p>
                    <p className="text-xs text-muted-foreground">{tm.team.category}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned to any team</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-fiim-coolgray p-2">
        <Icon className="h-4 w-4 text-fiim-sky" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-fiim-slate">{value}</p>
      </div>
    </div>
  )
}
