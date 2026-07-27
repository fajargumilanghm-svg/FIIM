import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'

export default function AthletesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; athlete: any }>({
    open: false,
    athlete: null,
  })

  useEffect(() => {
    loadAthletes()
  }, [user?.orgId, statusFilter])

  const loadAthletes = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const data = await apiService.getAthletes(user.orgId, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      })
      setAthletes(data)
    } catch (error) {
      console.error('Failed to load athletes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadAthletes()
  }

  const handleDelete = async () => {
    if (!deleteModal.athlete || !user?.orgId) return
    
    try {
      await apiService.deleteAthlete(deleteModal.athlete.id, user.orgId)
      setAthletes((prev) => prev.filter((a) => a.id !== deleteModal.athlete.id))
      setDeleteModal({ open: false, athlete: null })
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-fiim-emerald/10 text-fiim-emerald',
    INJURED: 'bg-red-500/10 text-red-500',
    RETURNING_TO_PLAY: 'bg-fiim-amber/10 text-fiim-amber',
    RETIRED: 'bg-gray-500/10 text-gray-500',
    TRANSFERRED: 'bg-blue-500/10 text-blue-500',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fiim-slate">Athletes</h2>
          <p className="text-muted-foreground">
            Manage your athlete roster and profiles
          </p>
        </div>
        <Link
          to="/athletes/new"
          className="inline-flex items-center gap-2 rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90"
        >
          <Plus className="h-4 w-4" />
          Add Athlete
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-white py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </form>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-md border border-input bg-white px-4 py-2 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INJURED">Injured</option>
            <option value="RETURNING_TO_PLAY">Returning to Play</option>
            <option value="RETIRED">Retired</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Athletes Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-fiim-slate">No athletes found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by adding your first athlete to the roster.
            </p>
            <Link
              to="/athletes/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90"
            >
              <Plus className="h-4 w-4" />
              Add Athlete
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-fiim-coolgray/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-fiim-slate">Athlete</th>
                  <th className="px-6 py-3 font-medium text-fiim-slate">Sport / Position</th>
                  <th className="px-6 py-3 font-medium text-fiim-slate">Status</th>
                  <th className="px-6 py-3 font-medium text-fiim-slate">Jersey</th>
                  <th className="px-6 py-3 font-medium text-fiim-slate text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {athletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-fiim-coolgray/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fiim-sky/10 text-fiim-sky font-bold text-xs">
                          {athlete.firstName[0]}{athlete.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-fiim-slate">
                            {athlete.firstName} {athlete.lastName}
                          </p>
                          {athlete.email && (
                            <p className="text-xs text-muted-foreground">{athlete.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {athlete.sport?.name || '—'}
                      {athlete.position?.abbreviation && (
                        <span className="ml-2 text-xs">({athlete.position.abbreviation})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[athlete.status] || 'bg-gray-500/10 text-gray-500'}`}>
                        {athlete.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {athlete.jerseyNumber || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/athletes/${athlete.id}`)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-fiim-coolgray hover:text-fiim-slate"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/athletes/${athlete.id}/edit`)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-fiim-coolgray hover:text-fiim-slate"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, athlete })}
                          className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-fiim-slate">Remove Athlete</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to remove{' '}
              <span className="font-medium text-fiim-slate">
                {deleteModal.athlete?.firstName} {deleteModal.athlete?.lastName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, athlete: null })}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium text-fiim-slate hover:bg-fiim-coolgray"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
