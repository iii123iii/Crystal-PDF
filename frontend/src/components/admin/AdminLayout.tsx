import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, ArrowLeft, LogOut, Gem, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { apiFetch } from '../../lib/api'

const navItems = [
  { to: '/admin',          label: 'Overview',  icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Users',     icon: Users },
  { to: '/admin/settings', label: 'Settings',  icon: Settings },
]

export default function AdminLayout() {
  const clearAuth = useAppStore((s) => s.clearAuth)
  const navigate  = useNavigate()

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <Gem size={16} style={{ color: '#f59e0b' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Crystal PDF</span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <ShieldCheck size={11} />
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'font-medium'
                    : 'font-normal'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                color: isActive ? '#f59e0b' : 'var(--color-muted)',
                borderLeft: isActive ? '2px solid #f59e0b' : '2px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 pt-2 border-t space-y-0.5" style={{ borderColor: 'var(--color-border)' }}>
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <ArrowLeft size={14} />
            Back to App
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
