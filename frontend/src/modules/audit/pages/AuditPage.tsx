import { useState, useEffect } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import apiService from '../../../services/api.service'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { ScrollText, ShieldCheck } from 'lucide-react'

interface AuditItem {
  id: string
  action: string
  entityType: string
  entityId: string | null
  description: string | null
  containsMedicalData: boolean
  createdAt: string
  user?: { firstName: string; lastName: string; email: string } | null
}

const ACTIONS = [
  'ALL',
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'EXPORT',
  'ALERT_TRIGGERED',
  'CONFIG_CHANGED',
]

const ACTION_TINT: Record<string, string> = {
  CREATE: 'bg-fiim-emerald/10 text-fiim-emerald',
  UPDATE: 'bg-fiim-sky/10 text-fiim-sky',
  DELETE: 'bg-red-500/10 text-red-600',
  LOGIN: 'bg-fiim-slate/10 text-fiim-slate',
  EXPORT: 'bg-purple-500/10 text-purple-600',
  ALERT_TRIGGERED: 'bg-fiim-amber/10 text-fiim-amber',
  CONFIG_CHANGED: 'bg-fiim-amber/10 text-fiim-amber',
}

export default function AuditPage() {
  const { user } = useAuthStore()
  const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'ORGANIZATION_ADMIN'
  const [items, setItems] = useState<AuditItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    if (canView) load()
    else setLoading(false)
  }, [user?.orgId, actionFilter])

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    try {
      const params = actionFilter === 'ALL' ? { limit: 100 } : { action: actionFilter, limit: 100 }
      const data = await apiService.getAuditLogs(user.orgId, params)
      setItems(data.items)
      setTotal(data.total)
    } catch (e: any) {
      if (e?.response?.status === 403) setForbidden(true)
      console.error('Audit load error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!canView || forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-fiim-slate">Admins only</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The audit log is restricted to organization administrators.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fiim-slate">Audit Log</h2>
        <p className="text-muted-foreground">
          {total.toLocaleString()} recorded events • compliance trail (GDPR/HIPAA)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              actionFilter === a
                ? 'bg-fiim-slate text-white'
                : 'bg-white text-fiim-slate shadow-sm hover:bg-fiim-coolgray/50'
            }`}
          >
            {a.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="rounded-xl bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <ScrollText className="mx-auto mb-3 h-10 w-10 opacity-50" />
            No audit entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Entity</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap p-4 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ACTION_TINT[item.action] ?? 'bg-fiim-coolgray/50 text-fiim-slate'
                        }`}
                      >
                        {item.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-fiim-slate">
                      {item.entityType}
                      {item.containsMedicalData && (
                        <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          medical
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                    </td>
                    <td className="p-4 text-muted-foreground">{item.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
