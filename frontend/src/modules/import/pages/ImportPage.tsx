import { useState } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { Upload, FileCheck2, AlertTriangle, CheckCircle2, ClipboardPaste } from 'lucide-react'

interface RowResult {
  line: number
  data: Record<string, unknown>
  errors: string[]
}

interface Preview {
  totalRows: number
  validCount: number
  invalidCount: number
  rows: RowResult[]
}

const TEMPLATE =
  'athleteId,surveyDate,sleepQuality,fatigueLevel,mood,stressLevel,muscleSoreness,hydration,nutrition,notes'

export default function ImportPage() {
  const { user } = useAuthStore()
  const [csv, setCsv] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [result, setResult] = useState<{ imported: number; skippedInvalid: number; failed: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePreview = async () => {
    setError(null)
    setResult(null)
    if (!csv.trim()) {
      setError('Paste some CSV first.')
      return
    }
    setBusy(true)
    try {
      setPreview(await apiService.previewWellnessImport(csv))
    } catch (e) {
      setError('Preview failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    if (!user?.orgId) return
    setBusy(true)
    setError(null)
    try {
      const res = await apiService.importWellness(user.orgId, csv)
      setResult(res)
      setPreview(null)
    } catch (e) {
      setError('Import failed.')
    } finally {
      setBusy(false)
    }
  }

  const loadTemplate = () => {
    setCsv(`${TEMPLATE}\n<athlete-uuid>,2026-07-01,8,4,7,3,5,8,7,Felt good`)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-fiim-slate">Import Data</h2>
        <p className="text-muted-foreground">Bulk-import wellness surveys from CSV</p>
      </div>

      {/* Editor */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-fiim-slate">Wellness CSV</label>
          <button
            onClick={loadTemplate}
            className="inline-flex items-center gap-1 text-xs font-medium text-fiim-sky hover:underline"
          >
            <ClipboardPaste className="h-3 w-3" /> Load template
          </button>
        </div>
        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value)
            setPreview(null)
            setResult(null)
          }}
          rows={10}
          placeholder={TEMPLATE}
          className="w-full rounded-md border border-input px-3 py-2 font-mono text-xs"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Required columns: <code>athleteId</code>, <code>surveyDate</code> (YYYY-MM-DD). Metric
          columns are optional integers 1–10.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePreview}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-fiim-slate hover:bg-fiim-coolgray/50 disabled:opacity-60"
          >
            <FileCheck2 className="h-4 w-4" /> Preview
          </button>
          <button
            onClick={handleImport}
            disabled={busy || !preview || preview.validCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-fiim-sky px-4 py-2 text-sm font-medium text-white transition hover:bg-fiim-sky/90 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {preview ? `Import ${preview.validCount} valid rows` : 'Import'}
          </button>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className="flex items-center gap-3 rounded-xl bg-fiim-emerald/10 p-4 text-fiim-emerald">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm">
            Imported <strong>{result.imported}</strong> surveys.{' '}
            {result.skippedInvalid > 0 && `${result.skippedInvalid} invalid rows skipped. `}
            {result.failed > 0 && `${result.failed} failed to insert.`}
          </p>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b p-6">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-fiim-emerald">
              <CheckCircle2 className="h-4 w-4" /> {preview.validCount} valid
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
              <AlertTriangle className="h-4 w-4" /> {preview.invalidCount} invalid
            </span>
            <span className="text-sm text-muted-foreground">of {preview.totalRows} rows</span>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Line</th>
                  <th className="p-3 font-medium">Athlete</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.rows.map((row) => (
                  <tr key={row.line} className={row.errors.length ? 'bg-red-500/5' : ''}>
                    <td className="p-3 text-muted-foreground">{row.line}</td>
                    <td className="p-3 text-fiim-slate">{String(row.data.athleteId ?? '—')}</td>
                    <td className="p-3 text-muted-foreground">{String(row.data.surveyDate ?? '—')}</td>
                    <td className="p-3">
                      {row.errors.length === 0 ? (
                        <span className="text-fiim-emerald">OK</span>
                      ) : (
                        <span className="text-red-600">{row.errors.join('; ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
