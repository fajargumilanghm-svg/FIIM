import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { HeartPulse, UserX, CalendarClock, Activity, Plus, X, ArrowRight } from 'lucide-react'

interface Injury {
  id: string
  bodyPart: string
  injuryType: string | null
  mechanism: string
  severity: 'MINOR' | 'MODERATE' | 'SEVERE'
  status: 'OPEN' | 'RECOVERING' | 'RETURN_TO_PLAY' | 'RESOLVED'
  onsetDate: string
  expectedReturnDate: string | null
  daysLost: number
  athlete?: { id: string; firstName: string; lastName: string; position?: { name: string } | null }
}

interface Stats {
  total: number
  currentlyOut: number
  totalDaysLost: number
  byStatus: Record<string, number>
  bySeverity: Record<string, number>
}

const STATUS_FLOW: Injury['status'][] = ['OPEN', 'RECOVERING', 'RETURN_TO_PLAY', 'RESOLVED']
const STATUS_FILTERS = ['OPEN', 'RECOVERING', 'RETURN_TO_PLAY', 'RESOLVED', 'ALL'] as const

export default function InjuriesPage() {
  const { user } = useAuthStore()
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [athletes, setAthletes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('OPEN')
  const [showForm, setShowForm] = useState(false)
  const [openCaseId, setOpenCaseId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [user?.orgId, statusFilter])

  const loadData = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const params = statusFilter === 'ALL' ? {} : { status: statusFilter }
      const [injuriesData, statsData, athletesData] = await Promise.all([
        apiService.getInjuries(user.orgId, params),
        apiService.getInjuryStats(user.orgId),
        apiService.getAthletes(user.orgId),
      ])
      setInjuries(injuriesData)
      setStats(statsData)
      setAthletes(athletesData)
    } catch (error) {
      console.error('Injuries load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const advanceStatus = async (injury: Injury) => {
    if (!user?.orgId) return
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(injury.status) + 1]
    if (!next) return
    await apiService.updateInjury(injury.id, user.orgId, { status: next })
    await loadData()
  }

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-fiim-slate">Injuries</h2>
          <p className="text-muted-foreground">Track injuries, days lost, and return-to-play</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90"
        >
          <Plus className="h-4 w-4" /> Report injury
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={HeartPulse} tint="sky" value={stats?.total ?? 0} label="Total Injuries" />
        <StatCard icon={UserX} tint="red" value={stats?.currentlyOut ?? 0} label="Currently Out" />
        <StatCard icon={CalendarClock} tint="amber" value={stats?.totalDaysLost ?? 0} label="Days Lost" />
        <StatCard icon={Activity} tint="emerald" value={stats?.byStatus?.RESOLVED ?? 0} label="Resolved" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === f
                ? 'bg-fiim-slate text-white'
                : 'bg-white text-fiim-slate shadow-sm hover:bg-fiim-coolgray/50'
            }`}
          >
            {statusLabel(f)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="divide-y">
          {injuries.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No {statusFilter === 'ALL' ? '' : statusLabel(statusFilter).toLowerCase()} injuries.
            </div>
          ) : (
            injuries.map((injury) => (
              <div key={injury.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className={`rounded-lg p-3 ${severityTint(injury.severity)}`}>
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-fiim-slate">
                      {injury.athlete?.firstName} {injury.athlete?.lastName}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityTint(injury.severity)}`}>
                      {injury.severity.toLowerCase()}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTint(injury.status)}`}>
                      {statusLabel(injury.status)}
                    </span>
                  </div>
                  <p className="text-sm text-fiim-slate">
                    {injury.bodyPart}
                    {injury.injuryType ? ` — ${injury.injuryType}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Onset {new Date(injury.onsetDate).toLocaleDateString()} •{' '}
                    {injury.mechanism.replace('_', ' ').toLowerCase()} • {injury.daysLost} days lost
                    {injury.expectedReturnDate
                      ? ` • ETA ${new Date(injury.expectedReturnDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpenCaseId(injury.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50"
                  >
                    View case
                  </button>
                  {injury.status !== 'RESOLVED' && (
                    <button
                      onClick={() => advanceStatus(injury)}
                      className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50"
                    >
                      {statusLabel(STATUS_FLOW[STATUS_FLOW.indexOf(injury.status) + 1])}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <InjuryForm
          athletes={athletes}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            loadData()
          }}
        />
      )}

      {openCaseId && (
        <InjuryCaseDrawer
          injuryId={openCaseId}
          onClose={() => setOpenCaseId(null)}
          onChanged={loadData}
        />
      )}
    </div>
  )
}

const RTP_STAGES = [
  'REST',
  'RECOVERY',
  'RECONDITIONING',
  'RETURN_TO_TRAINING',
  'RETURN_TO_PLAY',
] as const

function rtpLabel(stage: string) {
  return stage
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

function InjuryCaseDrawer({
  injuryId,
  onClose,
  onChanged,
}: {
  injuryId: string
  onClose: () => void
  onChanged: () => void
}) {
  const { user } = useAuthStore()
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      setCaseData(await apiService.getInjuryCase(injuryId, user.orgId))
    } catch {
      setError('Failed to load case.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [injuryId, user?.orgId])

  const action = async (fn: () => Promise<any>) => {
    if (!user?.orgId) return
    setBusy(true)
    setError(null)
    try {
      await fn()
      await load()
      onChanged()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const currentIdx = caseData?.currentRtpStage
    ? RTP_STAGES.indexOf(caseData.currentRtpStage)
    : -1

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-fiim-slate">Injury case</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-fiim-slate">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !caseData ? (
          <p className="text-sm text-muted-foreground">{error ?? 'No data.'}</p>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            {/* Summary */}
            <div>
              <p className="font-medium text-fiim-slate">
                {caseData.athlete?.firstName} {caseData.athlete?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {caseData.bodyPart} • {statusLabel(caseData.status)} •{' '}
                {caseData.severity?.toLowerCase()}
                {caseData.medicalHold ? ' • ⛔ Medical hold' : ''}
              </p>
            </div>

            {/* RTP stepper */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-fiim-slate">Return-to-play</h4>
                {currentIdx === -1 ? (
                  <button
                    disabled={busy}
                    onClick={() => action(() => apiService.startRtp(injuryId, user!.orgId!))}
                    className="rounded-md bg-fiim-sky px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Start pathway
                  </button>
                ) : (
                  caseData.currentRtpStage !== 'RETURN_TO_PLAY' && (
                    <button
                      disabled={busy}
                      onClick={() => action(() => apiService.advanceRtp(injuryId, user!.orgId!))}
                      className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50 disabled:opacity-50"
                    >
                      Advance stage
                    </button>
                  )
                )}
              </div>
              <ol className="space-y-2">
                {RTP_STAGES.map((stage, i) => {
                  const done = currentIdx > i
                  const active = currentIdx === i
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          done
                            ? 'bg-fiim-emerald text-white'
                            : active
                              ? 'bg-fiim-sky text-white'
                              : 'bg-fiim-coolgray/50 text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`text-sm ${active ? 'font-semibold text-fiim-slate' : 'text-muted-foreground'}`}
                      >
                        {rtpLabel(stage)}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            {caseData.clinicalAccess ? (
              <ClinicalPanels injuryId={injuryId} caseData={caseData} onAction={action} busy={busy} />
            ) : (
              <p className="rounded-md bg-fiim-coolgray/30 px-3 py-2 text-xs text-muted-foreground">
                Clinical details (diagnoses, treatment notes, clearances) are visible to medical
                staff only.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ClinicalPanels({
  injuryId,
  caseData,
  onAction,
  busy,
}: {
  injuryId: string
  caseData: any
  onAction: (fn: () => Promise<any>) => Promise<void>
  busy: boolean
}) {
  const { user } = useAuthStore()
  const [dx, setDx] = useState('')
  const [icd, setIcd] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="space-y-6 border-t pt-4">
      {/* Diagnoses */}
      <section>
        <h4 className="mb-2 font-semibold text-fiim-slate">Diagnoses</h4>
        <ul className="mb-2 space-y-1 text-sm">
          {(caseData.diagnoses ?? []).length === 0 ? (
            <li className="text-muted-foreground">None recorded.</li>
          ) : (
            caseData.diagnoses.map((d: any) => (
              <li key={d.id} className="text-fiim-slate">
                {d.icd10Code ? <span className="font-mono text-xs">{d.icd10Code} · </span> : null}
                {d.description}
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <input
            value={icd}
            onChange={(e) => setIcd(e.target.value)}
            placeholder="ICD-10"
            className="w-24 rounded-md border border-input px-2 py-1 text-sm"
          />
          <input
            value={dx}
            onChange={(e) => setDx(e.target.value)}
            placeholder="Diagnosis"
            className="flex-1 rounded-md border border-input px-2 py-1 text-sm"
          />
          <button
            disabled={busy || !dx}
            onClick={() =>
              onAction(() =>
                apiService.addDiagnosis(injuryId, user!.orgId!, {
                  description: dx,
                  icd10Code: icd || undefined,
                }),
              ).then(() => {
                setDx('')
                setIcd('')
              })
            }
            className="rounded-md bg-fiim-sky px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      {/* Treatment notes */}
      <section>
        <h4 className="mb-2 font-semibold text-fiim-slate">Treatment notes</h4>
        <ul className="mb-2 space-y-1 text-sm">
          {(caseData.treatmentNotes ?? []).length === 0 ? (
            <li className="text-muted-foreground">None recorded.</li>
          ) : (
            caseData.treatmentNotes.map((n: any) => (
              <li key={n.id} className="text-fiim-slate">
                {n.medicalHold ? '⛔ ' : ''}
                {n.note}
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="New note"
            className="flex-1 rounded-md border border-input px-2 py-1 text-sm"
          />
          <button
            disabled={busy || !note}
            onClick={() =>
              onAction(() =>
                apiService.addTreatmentNote(injuryId, user!.orgId!, { note }),
              ).then(() => setNote(''))
            }
            className="rounded-md bg-fiim-sky px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      {/* Clearances */}
      <section>
        <h4 className="mb-2 font-semibold text-fiim-slate">Medical clearances</h4>
        <ul className="mb-2 space-y-1 text-sm">
          {(caseData.clearances ?? []).length === 0 ? (
            <li className="text-muted-foreground">None recorded.</li>
          ) : (
            caseData.clearances.map((c: any) => (
              <li key={c.id} className="text-fiim-slate">
                {c.status}
                {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
              </li>
            ))
          )}
        </ul>
        <button
          disabled={busy}
          onClick={() =>
            onAction(() =>
              apiService.addClearance(injuryId, user!.orgId!, { status: 'CLEARED' }),
            )
          }
          className="rounded-md border border-input px-3 py-1 text-xs font-medium text-fiim-slate hover:bg-fiim-coolgray/50 disabled:opacity-50"
        >
          Record clearance (CLEARED)
        </button>
      </section>
    </div>
  )
}

function InjuryForm({
  athletes,
  onClose,
  onSaved,
}: {
  athletes: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    athleteId: athletes[0]?.id ?? '',
    bodyPart: '',
    injuryType: '',
    mechanism: 'NON_CONTACT',
    severity: 'MINOR',
    onsetDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!user?.orgId) return
    if (!form.athleteId || !form.bodyPart || !form.onsetDate) {
      setError('Athlete, body part, and onset date are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiService.createInjury(user.orgId, {
        ...form,
        expectedReturnDate: form.expectedReturnDate || undefined,
        injuryType: form.injuryType || undefined,
      })
      onSaved()
    } catch (e) {
      setError('Failed to save injury.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-fiim-slate">Report Injury</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-fiim-slate">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Athlete">
            <select
              value={form.athleteId}
              onChange={(e) => setForm({ ...form, athleteId: e.target.value })}
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
            >
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Body part">
              <input
                value={form.bodyPart}
                onChange={(e) => setForm({ ...form, bodyPart: e.target.value })}
                placeholder="e.g. Left hamstring"
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Injury type">
              <input
                value={form.injuryType}
                onChange={(e) => setForm({ ...form, injuryType: e.target.value })}
                placeholder="e.g. Grade II strain"
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Mechanism">
              <select
                value={form.mechanism}
                onChange={(e) => setForm({ ...form, mechanism: e.target.value })}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              >
                <option value="NON_CONTACT">Non-contact</option>
                <option value="CONTACT">Contact</option>
                <option value="OVERUSE">Overuse</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              >
                <option value="MINOR">Minor</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </Field>
            <Field label="Onset date">
              <input
                type="date"
                value={form.onsetDate}
                onChange={(e) => setForm({ ...form, onsetDate: e.target.value })}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Expected return">
              <input
                type="date"
                value={form.expectedReturnDate}
                onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-fiim-slate hover:bg-fiim-coolgray/50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-fiim-sky px-4 py-2 text-sm font-medium text-white hover:bg-fiim-sky/90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-fiim-slate">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function statusLabel(status: string) {
  if (status === 'ALL') return 'All'
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

function severityTint(severity: string) {
  if (severity === 'SEVERE') return 'bg-red-500/10 text-red-600'
  if (severity === 'MODERATE') return 'bg-fiim-amber/10 text-fiim-amber'
  return 'bg-fiim-sky/10 text-fiim-sky'
}

function statusTint(status: string) {
  if (status === 'OPEN') return 'bg-red-500/10 text-red-600'
  if (status === 'RECOVERING') return 'bg-fiim-amber/10 text-fiim-amber'
  if (status === 'RETURN_TO_PLAY') return 'bg-fiim-sky/10 text-fiim-sky'
  return 'bg-fiim-emerald/10 text-fiim-emerald'
}

function StatCard({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: any
  tint: 'red' | 'amber' | 'sky' | 'emerald'
  value: string | number
  label: string
}) {
  const tints: Record<string, string> = {
    red: 'bg-red-500/10 text-red-600',
    amber: 'bg-fiim-amber/10 text-fiim-amber',
    sky: 'bg-fiim-sky/10 text-fiim-sky',
    emerald: 'bg-fiim-emerald/10 text-fiim-emerald',
  }
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-3 ${tints[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-fiim-slate">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
