import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Input, Select } from '../../../components/ui/Field'
import { Search, Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

const statusVariant: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  INJURED: 'danger',
  RETURNING_TO_PLAY: 'warning',
  RETIRED: 'neutral',
  TRANSFERRED: 'primary',
}

export default function AthletesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; athlete: any }>({ open: false, athlete: null })
  const [deleting, setDeleting] = useState(false)

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
      toast.error('Failed to load athletes. Please try again.')
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
    const name = `${deleteModal.athlete.firstName} ${deleteModal.athlete.lastName}`
    setDeleting(true)
    try {
      await apiService.deleteAthlete(deleteModal.athlete.id, user.orgId)
      setAthletes((prev) => prev.filter((a) => a.id !== deleteModal.athlete.id))
      setDeleteModal({ open: false, athlete: null })
      toast.success(`${name} removed from roster`)
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(`Could not remove ${name}. Please try again.`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Athletes"
        description="Manage your athlete roster and profiles"
        actions={
          <Button onClick={() => navigate('/athletes/new')} size="sm">
            <Plus /> Add Athlete
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search athletes"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
        <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-52">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INJURED">Injured</option>
          <option value="RETURNING_TO_PLAY">Returning to Play</option>
          <option value="RETIRED">Retired</option>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">No athletes found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Get started by adding your first athlete to the roster.
            </p>
            <Button onClick={() => navigate('/athletes/new')} size="sm" className="mt-4">
              <Plus /> Add Athlete
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Athlete</th>
                  <th scope="col" className="px-5 py-3 font-medium">Sport / Position</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Jersey</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {athletes.map((athlete) => (
                  <tr key={athlete.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {athlete.firstName[0]}
                          {athlete.lastName[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {athlete.firstName} {athlete.lastName}
                          </p>
                          {athlete.email && <p className="truncate text-xs text-muted-foreground">{athlete.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {athlete.sport?.name || '—'}
                      {athlete.position?.abbreviation && <span className="ml-2 text-xs">({athlete.position.abbreviation})</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={statusVariant[athlete.status] || 'neutral'}>
                        {athlete.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{athlete.jerseyNumber || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/athletes/${athlete.id}`)}
                          aria-label={`View ${athlete.firstName} ${athlete.lastName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => navigate(`/athletes/${athlete.id}/edit`)}
                          aria-label={`Edit ${athlete.firstName} ${athlete.lastName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, athlete })}
                          aria-label={`Remove ${athlete.firstName} ${athlete.lastName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete modal */}
      {deleteModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={() => !deleting && setDeleteModal({ open: false, athlete: null })}
        >
          <Card className="w-full max-w-md p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 id="delete-title" className="text-lg font-semibold text-foreground">Remove Athlete</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to remove{' '}
              <span className="font-medium text-foreground">
                {deleteModal.athlete?.firstName} {deleteModal.athlete?.lastName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal({ open: false, athlete: null })} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <LoadingSpinner size="sm" /> : <Trash2 />}
                Remove
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
