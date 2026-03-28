import { NavLink, useNavigate } from 'react-router-dom'
import { Sun, Moon, ShieldCheck, LogOut } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const tabs = [
  { label: 'All Tools', to: '/dashboard' },
  { label: 'My Files', to: '/dashboard/files' },
  { label: 'Settings', to: '/settings' },
]

export default function DashboardHeader() {
  const userEmail   = useAppStore((s) => s.userEmail)
  const isAdmin     = useAppStore((s) => s.isAdmin)
  const clearAuth   = useAppStore((s) => s.clearAuth)
  const theme       = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const navigate    = useNavigate()

  const initial = userEmail?.[0]?.toUpperCase() ?? '?'
  const isDark  = theme === 'dark'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className="shrink-0 flex items-center px-5 border-b select-none"
      style={{
        height: 56,
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* ── Logo ── */}
      <NavLink to="/dashboard" className="flex items-center gap-2.5 mr-8">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-accent)', opacity: 0.9 }}
        >
          <span className="text-white font-bold text-xs">C</span>
        </div>
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--color-text)' }}
        >
          Crystal<span style={{ color: 'var(--color-accent)' }}>PDF</span>
        </span>
      </NavLink>

      {/* ── Center tabs ── */}
      <nav className="flex items-center gap-1 h-full">
        {tabs.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className="relative h-full flex items-center px-3 text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                {label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-2)'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Admin link */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ color: '#f59e0b' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ShieldCheck size={13} />
            Admin
          </NavLink>
        )}

        {/* Separator */}
        <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

        {/* User avatar + email */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
          >
            {initial}
          </div>
          <span className="text-xs max-w-[140px] truncate" style={{ color: 'var(--color-muted)' }}>
            {userEmail}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-2)'
            e.currentTarget.style.color = 'var(--color-text)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}
