import { useState } from 'react'
import { X, Dumbbell, Clock, MapPin, Calendar } from 'lucide-react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import toast from 'react-hot-toast'

interface TrainingSessionQuickEntryProps {
  isOpen: boolean
  onClose: () => void
  athletes: any[]
}

export default function TrainingSessionQuickEntry({ isOpen, onClose, athletes }: TrainingSessionQuickEntryProps) {
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [plannedRpe, setPlannedRpe] = useState(6)
  const [location, setLocation] = useState('Main Field')
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!user?.orgId || !name || !sessionDate) return

    setSubmitting(true)
    try {
        const sessionRes = await apiService.client.post(`/training/sessions?orgId=${user.orgId}`, {
        name,
        description,
        scheduledDate: sessionDate,
        sessionType: 'TRAINING',
        durationMinutes,
        plannedRpe,
        location,
      })

      const sessionId = sessionRes.data.id

      // Create athlete loads for selected athletes
      if (selectedAthletes.length > 0) {
        await Promise.all(
          selectedAthletes.map((athleteId) =>
            apiService.client.post(`/training/sessions/${sessionId}/athlete-load?orgId=${user.orgId}`, {
              athleteId,
              rpeScore: plannedRpe,
              durationMinutes,
            })
          )
        )
      }

      toast.success('Training session created!')
      setName('')
      setDescription('')
      setDurationMinutes(90)
      setPlannedRpe(6)
      setLocation('Main Field')
      setSelectedAthletes([])
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create session')
    } finally {
      setSubmitting(false)
    }
  }

  const allValid = name && sessionDate && selectedAthletes.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-fiim-slate">New Training Session</h3>
            <p className="text-sm text-muted-foreground">Schedule a session and assign athletes</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-fiim-coolgray"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-fiim-slate">Session Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Conditioning"
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-fiim-slate">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Session objectives..."
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-fiim-slate flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-fiim-slate flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (min)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={15}
                max={300}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* RPE & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-fiim-slate flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Planned RPE (1-10)
              </label>
              <input
                type="number"
                value={plannedRpe}
                onChange={(e) => setPlannedRpe(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-fiim-slate flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Main Field"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Athletes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-fiim-slate">Athletes ({selectedAthletes.length} selected)</label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-input p-2">
              {athletes.map((athlete: any) => (
                <label
                  key={athlete.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-fiim-coolgray cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAthletes.includes(athlete.id)}
                    onChange={() => toggleAthlete(athlete.id)}
                    className="h-4 w-4 accent-fiim-sky"
                  />
                  <span className="text-sm text-fiim-slate">
                    {athlete.firstName} {athlete.lastName}
                    {athlete.jerseyNumber ? ` (#${athlete.jerseyNumber})` : ''}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{athlete.position}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-fiim-slate hover:bg-fiim-coolgray"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allValid || submitting}
            className="rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
