import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field'
import { ArrowLeft, Save } from 'lucide-react'

export default function AthleteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    heightCm: '',
    weightKg: '',
    sportId: '',
    positionId: '',
    jerseyNumber: '',
    status: 'ACTIVE',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    notes: '',
  })

  useEffect(() => {
    if (isEditing && id && user?.orgId) {
      loadAthlete()
    }
  }, [isEditing, id, user?.orgId])

  const loadAthlete = async () => {
    try {
      const data = await apiService.getAthlete(id!, user!.orgId!)
      setFormData({
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
      })
    } catch (error) {
      console.error('Failed to load athlete:', error)
      toast.error('Failed to load athlete details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.orgId) return

    setSaving(true)
    try {
      const dataToSend = {
        ...formData,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
      }

      if (isEditing) {
        await apiService.updateAthlete(id!, dataToSend, user.orgId)
        toast.success('Athlete updated')
      } else {
        await apiService.createAthlete(dataToSend, user.orgId)
        toast.success('Athlete created')
      }
      navigate('/athletes')
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('Could not save athlete. Please check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/athletes')}
          aria-label="Back to athletes"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {isEditing ? 'Edit Athlete' : 'Add New Athlete'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Update athlete information' : 'Create a new athlete profile'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name" htmlFor="firstName" required>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </Field>
            <Field label="Last Name" htmlFor="lastName" required>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} autoComplete="tel" />
            </Field>
            <Field label="Date of Birth" htmlFor="dateOfBirth">
              <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
            </Field>
            <Field label="Gender" htmlFor="gender">
              <Select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Nationality" htmlFor="nationality">
              <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="US, UK, etc." />
            </Field>
            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INJURED">Injured</option>
                <option value="RETURNING_TO_PLAY">Returning to Play</option>
                <option value="RETIRED">Retired</option>
                <option value="TRANSFERRED">Transferred</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* Physical & Sport */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Physical & Sport Info</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Height (cm)" htmlFor="heightCm">
              <Input id="heightCm" name="heightCm" type="number" value={formData.heightCm} onChange={handleChange} />
            </Field>
            <Field label="Weight (kg)" htmlFor="weightKg">
              <Input id="weightKg" name="weightKg" type="number" value={formData.weightKg} onChange={handleChange} />
            </Field>
            <Field label="Jersey Number" htmlFor="jerseyNumber">
              <Input id="jerseyNumber" name="jerseyNumber" type="number" value={formData.jerseyNumber} onChange={handleChange} />
            </Field>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Emergency Contact</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" htmlFor="emergencyContactName">
              <Input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
            </Field>
            <Field label="Phone" htmlFor="emergencyContactPhone">
              <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleChange} />
            </Field>
            <Field label="Relationship" htmlFor="emergencyContactRelation">
              <Input id="emergencyContactRelation" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} />
            </Field>
          </div>
        </Card>

        {/* Notes */}
        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Notes</h3>
          <Field label="Notes" htmlFor="notes" className="[&_label]:sr-only">
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Additional notes about the athlete..."
            />
          </Field>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/athletes')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" /> Saving...
              </>
            ) : (
              <>
                <Save /> {isEditing ? 'Update Athlete' : 'Create Athlete'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
