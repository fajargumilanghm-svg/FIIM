import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import {
  LayoutDashboard,
  Users,
  Activity,
  ClipboardList,
  Bell,
  HeartPulse,
  FileText,
  ScrollText,
  Upload,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../../lib/utils'
import NotificationBell from './NotificationBell'

type NavItem = { name: string; href: string; icon: LucideIcon }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Athletes', href: '/athletes', icon: Users },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'Training Load', href: '/training', icon: Activity },
      { name: 'Wellness', href: '/wellness', icon: ClipboardList },
      { name: 'Injuries', href: '/injuries', icon: HeartPulse },
      { name: 'Alerts', href: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'Records',
    items: [
      { name: 'Reports', href: '/reports', icon: FileText },
      { name: 'Audit', href: '/audit', icon: ScrollText },
      { name: 'Import', href: '/import', icon: Upload },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Admin', href: '/admin', icon: ShieldCheck },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

const allItems = navGroups.flatMap((g) => g.items)

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const currentTitle =
    allItems.find((n) => isActivePath(location.pathname, n.href))?.name || 'FIIM'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-border bg-card transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">FIIM</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Primary">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(location.pathname, item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {user?.displayName || `${user?.firstName} ${user?.lastName}`}
              </span>
              <span className="block truncate text-xs capitalize text-muted-foreground">
                {user?.role?.toLowerCase().replace(/_/g, ' ')}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                userMenuOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {userMenuOpen && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-base font-semibold text-foreground">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{user?.orgName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
