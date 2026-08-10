import { useEffect, useRef, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import apiService from '../../../services/api.service'

interface Notification {
  id: string
  type: string
  severity: string | null
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

const severityDot: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-fiim-amber',
  INFO: 'bg-fiim-sky',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const loadCount = async () => {
    try {
      const res = await apiService.getUnreadNotificationCount()
      setUnread(res?.unread ?? 0)
    } catch {
      /* ignore polling errors */
    }
  }

  const loadItems = async () => {
    try {
      setItems(await apiService.getNotifications())
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadCount()
    const timer = setInterval(loadCount, 60000) // poll every minute
    return () => clearInterval(timer)
  }, [])

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) await loadItems()
  }

  const markRead = async (id: string) => {
    await apiService.markNotificationRead(id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    loadCount()
  }

  const markAll = async () => {
    await apiService.markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No notifications.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-accent ${
                    n.readAt ? 'opacity-60' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      severityDot[n.severity ?? ''] ?? 'bg-muted-foreground'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {n.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
