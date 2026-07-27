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
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Athletes', href: '/athletes', icon: Users },
  { name: 'Training Load', href: '/training', icon: Activity },
  { name: 'Wellness', href: '/wellness', icon: ClipboardList },
  { name: 'Injuries', href: '/injuries', icon: HeartPulse },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Audit', href: '/audit', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-fiim-coolgray">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-fiim-slate text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-fiim-sky" />
            <span className="text-lg font-bold">FIIM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-fiim-sky text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fiim-sky text-white text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">{user?.displayName || `${user?.firstName} ${user?.lastName}`}</p>
              <p className="text-xs text-white/50">{user?.role}</p>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="mt-2 space-y-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-fiim-slate"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-fiim-slate">
              {navigation.find((n) => location.pathname === n.href || location.pathname.startsWith(`${n.href}/`))?.name || 'FIIM'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-fiim-slate">{user?.orgName}</p>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
