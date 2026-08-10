import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import toast from 'react-hot-toast'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Textarea } from '../../../components/ui/Field'

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
    setSelectedAthletes((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
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

      if (selectedAthletes.length > 0) {
        await Promise.all(
          selectedAthletes.map((athleteId) =>
            apiService.client.post(`/training/sessions/${sessionId}/athlete-load?orgId=${user.orgId}`, {
              athleteId,
              rpeScore: plannedRpe,
              durationMinutes,
            }),
          ),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-entry-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 id="training-entry-title" className="text-lg font-semibold text-foreground">
              New Training Session
            </h3>
            <p className="text-sm text-muted-foreground">Schedule a session and assign athletes</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <Field label="Session Name" htmlFor="session-name">
            <Input id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Morning Conditioning" />
          </Field>

          <Field label="Description" htmlFor="session-desc">
            <Textarea id="session-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Session objectives..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="session-date">
              <Input id="session-date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </Field>
            <Field label="Duration (min)" htmlFor="session-duration">
              <Input id="session-duration" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} min={15} max={300} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Planned RPE (1-10)" htmlFor="session-rpe">
              <Input id="session-rpe" type="number" value={plannedRpe} onChange={(e) => setPlannedRpe(Number(e.target.value))} min={1} max={10} />
            </Field>
            <Field label="Location" htmlFor="session-location">
              <Input id="session-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Main Field" />
            </Field>
          </div>

          {/* Athletes */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Athletes ({selectedAthletes.length} selected)</span>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-input p-2">
              {athletes.map((athlete: any) => (
                <label key={athlete.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={selectedAthletes.includes(athlete.id)}
                    onChange={() => toggleAthlete(athlete.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">
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
        <div className="flex justify-end gap-3 border-t border-border p-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!allValid || submitting}>
            {submitting ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </div>
    </div>
  )
}
