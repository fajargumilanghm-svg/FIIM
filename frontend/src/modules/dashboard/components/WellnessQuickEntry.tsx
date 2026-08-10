import { useState } from 'react'
import { X, Heart, Moon, Frown, Zap, Brain } from 'lucide-react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import toast from 'react-hot-toast'
import { Button } from '../../../components/ui/Button'
import { Field, Select, Textarea } from '../../../components/ui/Field'

interface WellnessQuickEntryProps {
  isOpen: boolean
  onClose: () => void
  athletes: any[]
}

const WELLNESS_METRICS = [
  { id: 'sleepQuality', label: 'Sleep Quality', icon: Moon, min: 1, max: 10 },
  { id: 'fatigueLevel', label: 'Fatigue Level', icon: Zap, min: 1, max: 10 },
  { id: 'mood', label: 'Mood', icon: Frown, min: 1, max: 10 },
  { id: 'stressLevel', label: 'Stress Level', icon: Brain, min: 1, max: 10 },
  { id: 'muscleSoreness', label: 'Muscle Soreness', icon: Heart, min: 1, max: 10 },
]

export default function WellnessQuickEntry({ isOpen, onClose, athletes }: WellnessQuickEntryProps) {
  const { user } = useAuthStore()
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || '')
  const [values, setValues] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSliderChange = (metricId: string, value: number) => {
    setValues((prev) => ({ ...prev, [metricId]: value }))
  }

  const handleSubmit = async () => {
    if (!athleteId || !user?.orgId) return

    setSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await apiService.client.post(`/wellness?orgId=${user.orgId}`, {
        athleteId,
        surveyDate: today,
        ...values,
        notes,
      })
      toast.success('Wellness entry saved!')
      setValues({})
      setNotes('')
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save wellness entry')
    } finally {
      setSubmitting(false)
    }
  }

  const allMetricsFilled = WELLNESS_METRICS.every((m) => values[m.id] !== undefined)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wellness-entry-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 id="wellness-entry-title" className="text-lg font-semibold text-foreground">
              Daily Wellness Check
            </h3>
            <p className="text-sm text-muted-foreground">Record athlete wellness metrics</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Athlete selector */}
        <div className="border-b border-border p-4">
          <Field label="Athlete" htmlFor="wellness-athlete-select">
            <Select id="wellness-athlete-select" value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
              {athletes.map((athlete: any) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName} {athlete.jerseyNumber ? `(#${athlete.jerseyNumber})` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Metrics */}
        <div className="space-y-5 p-4">
          {WELLNESS_METRICS.map((metric) => {
            const Icon = metric.icon
            const value = values[metric.id] || 5
            return (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold tabular-nums text-primary">
                    {value}
                  </span>
                </div>
                <input
                  type="range"
                  min={metric.min}
                  max={metric.max}
                  value={value}
                  aria-label={metric.label}
                  onChange={(e) => handleSliderChange(metric.id, parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Poor ({metric.min})</span>
                  <span>Excellent ({metric.max})</span>
                </div>
              </div>
            )
          })}

          <Field label="Additional Notes" htmlFor="wellness-notes">
            <Textarea
              id="wellness-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any injuries, concerns, or notes..."
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border p-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!allMetricsFilled || submitting}>
            {submitting ? 'Saving...' : 'Submit Wellness Entry'}
          </Button>
        </div>
      </div>
    </div>
  )
}
