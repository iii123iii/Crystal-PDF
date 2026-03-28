import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Files,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { toolCategories } from '../../data/tools'

export default function Sidebar() {
  const userEmail    = useAppStore((s) => s.userEmail)
  const isAdmin      = useAppStore((s) => s.isAdmin)
  const clearAuth    = useAppStore((s) => s.clearAuth)
  const theme        = useAppStore((s) => s.theme)
  const toggleTheme  = useAppStore((s) => s.toggleTheme)
  const navigate     = useNavigate()

  // Track which categories are collapsed
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const initial  = userEmail?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearAuth()
    navigate('/login', { replace: true })
  }

  function toggleCat(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isDark = theme === 'dark'

  return (
    <aside
      className="w-[228px] shrink-0 flex flex-col overflow-y-auto"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 select-none"
        >
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-md transition-colors"
          style={{
            color: 'var(--color-muted)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* ── All Tools link ── */}
      <div className="px-3 mb-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
              isActive
                ? 'text-[var(--color-text)] bg-[var(--color-surface-2)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
            }`
          }
          end
        >
          <LayoutGrid size={14} />
          All Tools
        </NavLink>
      </div>

      <div
        className="mx-3 mb-3"
        style={{ height: '1px', background: 'var(--color-border)' }}
      />

      {/* ── Tool categories ── */}
      <nav className="flex-1 px-3 space-y-0.5">
        {toolCategories.map((cat) => {
          const isOpen = !collapsed[cat.id]
          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: cat.color }}
                />
                <span className="flex-1 text-left">{cat.label}</span>
                <ChevronDown
                  size={11}
                  style={{
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              </button>

              {/* Tool links */}
              {isOpen && (
                <div className="mt-0.5 mb-1 space-y-0.5 pl-4">
                  {cat.tools.map((tool) => {
                    const Icon = tool.icon
                    return (
                      <NavLink
                        key={tool.id}
                        to={`/dashboard#${tool.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          // Scroll to category section on dashboard
                          const el = document.getElementById(`cat-${cat.id}`)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-text)'
                          e.currentTarget.style.background = 'var(--color-surface-2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-muted)'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Icon size={12} style={{ color: cat.color, flexShrink: 0 }} />
                        {tool.label}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom nav ── */}
      <div
        className="mx-3 mt-2"
        style={{ height: '1px', background: 'var(--color-border)' }}
      />
      <div className="px-3 py-2 space-y-0.5">
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-text)] bg-[var(--color-surface-2)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`
            }
          >
            <ShieldCheck size={13} style={{ color: '#f59e0b' }} />
            <span>Admin Panel</span>
          </NavLink>
        )}
        <NavLink
          to="/dashboard/files"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'text-[var(--color-text)] bg-[var(--color-surface-2)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
            }`
          }
        >
          <Files size={13} />
          My Files
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'text-[var(--color-text)] bg-[var(--color-surface-2)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
            }`
          }
        >
          <Settings size={13} />
          Settings
        </NavLink>
      </div>

      {/* ── User card ── */}
      <div
        className="mx-3 mb-4 mt-1 rounded-lg p-2.5 flex items-center gap-2"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold select-none"
          style={{
            background: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
          }}
        >
          {initial}
        </div>
        <span
          className="flex-1 text-xs truncate min-w-0"
          style={{ color: 'var(--color-muted)' }}
        >
          {userEmail}
        </span>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="shrink-0 transition-colors"
          style={{ color: 'var(--color-muted-2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted-2)')}
        >
          <LogOut size={12} />
        </button>
      </div>
    </aside>
  )
}
