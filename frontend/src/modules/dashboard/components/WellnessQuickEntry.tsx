import { useState } from 'react'
import { X, Heart, Moon, Frown, Zap, Brain } from 'lucide-react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import toast from 'react-hot-toast'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-lg font-semibold text-fiim-slate">Daily Wellness Check</h3>
            <p className="text-sm text-muted-foreground">Record athlete wellness metrics</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-fiim-coolgray"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Athlete Selector */}
        <div className="border-b p-4">
          <label className="text-sm font-medium text-fiim-slate">Athlete</label>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
          >
            {athletes.map((athlete: any) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.firstName} {athlete.lastName} {athlete.jerseyNumber ? `(#${athlete.jerseyNumber})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Metrics */}
        <div className="space-y-6 p-4">
          {WELLNESS_METRICS.map((metric) => {
            const Icon = metric.icon
            const value = values[metric.id] || 5

            return (
              <div key={metric.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-fiim-sky" />
                    <span className="text-sm font-medium text-fiim-slate">{metric.label}</span>
                  </div>
                  <span className="rounded-md bg-fiim-sky/10 px-2 py-1 text-sm font-bold text-fiim-sky">
                    {value}
                  </span>
                </div>
                <input
                  type="range"
                  min={metric.min}
                  max={metric.max}
                  value={value}
                  onChange={(e) => handleSliderChange(metric.id, parseInt(e.target.value))}
                  className="w-full cursor-pointer appearance-none rounded-lg bg-fiim-coolgray accent-fiim-sky"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Poor ({metric.min})</span>
                  <span>Excellent ({metric.max})</span>
                </div>
              </div>
            )
          })}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-fiim-slate">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any injuries, concerns, or notes..."
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
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
            disabled={!allMetricsFilled || submitting}
            className="rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Submit Wellness Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}
