import { useEffect, useState, useRef } from 'react'
import { Search, Trash2, Check, X, ShieldCheck, ShieldOff, KeyRound, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useToastStore } from '../../store/useToastStore'
import { useAppStore } from '../../store/useAppStore'

interface AdminUser {
  id: number
  email: string
  username: string | null
  admin: boolean
  passwordChangeRequired: boolean
  storageLimitBytes: number
  storageUsedBytes: number
  fileCount: number
  createdAt: string
}

type Filter = 'all' | 'admin' | 'regular'

function fmtMB(bytes: number) { return `${(bytes / (1024 * 1024)).toFixed(0)} MB` }
function barColor(pct: number) { return pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#3b82f6' }

/* ── Inline storage limit editor ── */
function StorageLimitCell({ user, onUpdated }: { user: AdminUser; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState('')
  const [saving, setSaving]   = useState(false)
  const addToast = useToastStore(s => s.addToast)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setVal(Math.round(user.storageLimitBytes / (1024 * 1024)).toString())
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function save() {
    const mb = parseInt(val)
    if (!mb || mb <= 0) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/storage-limit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLimitBytes: mb * 1024 * 1024 }),
      })
      if (res.ok) { addToast('success', 'Limit updated'); onUpdated() }
      else addToast('error', 'Failed to update')
    } finally { setSaving(false); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="w-20 text-xs rounded px-2 py-1 text-right font-mono"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
          disabled={saving} />
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>MB</span>
        <button onClick={save} disabled={saving} className="p-0.5" style={{ color: '#10b981' }}><Check size={13} /></button>
        <button onClick={() => setEditing(false)} className="p-0.5" style={{ color: 'var(--color-muted)' }}><X size={13} /></button>
      </div>
    )
  }

  return (
    <button onClick={startEdit} className="text-xs px-2 py-1 rounded font-mono transition-all"
      style={{ color: 'var(--color-muted)', border: '1px solid transparent' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)' }}
      title="Click to edit">
      {fmtMB(user.storageLimitBytes)}
    </button>
  )
}

/* ── Row action menu ── */
function ActionMenu({ user, isSelf, onAction }: {
  user: AdminUser; isSelf: boolean; onAction: (action: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg transition-all"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 rounded-lg py-1 shadow-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {!isSelf && (
            <button onClick={() => { onAction('toggle-admin'); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              {user.admin ? <ShieldOff size={12} style={{ color: '#f59e0b' }} /> : <ShieldCheck size={12} style={{ color: '#f59e0b' }} />}
              {user.admin ? 'Remove admin role' : 'Make admin'}
            </button>
          )}
          <button onClick={() => { onAction('reset-password'); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
            style={{ color: 'var(--color-text)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <KeyRound size={12} style={{ color: '#8b5cf6' }} />
            Force password reset
          </button>
          {!isSelf && (
            <button onClick={() => { onAction('delete'); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <Trash2 size={12} />
              Delete user
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function AdminUsersPage() {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState<Filter>('all')
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20
  const addToast  = useToastStore(s => s.addToast)
  const selfEmail = useAppStore(s => s.userEmail)

  function load() {
    setLoading(true)
    apiFetch(`/api/admin/users?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}&filter=${filter}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.content || [])
        setTotalPages(data.totalPages || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(load, [page, pageSize, query, filter])

  async function handleAction(user: AdminUser, action: string) {
    if (action === 'delete') {
      if (!confirm(`Delete "${user.email}" and all their files? This cannot be undone.`)) return
      const res = await apiFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) { addToast('success', `User ${user.email} deleted`); load() }
      else addToast('error', 'Failed to delete user')
    } else if (action === 'toggle-admin') {
      const verb = user.admin ? 'Remove admin from' : 'Make admin:'
      if (!confirm(`${verb} ${user.email}?`)) return
      const res = await apiFetch(`/api/admin/users/${user.id}/toggle-admin`, { method: 'PATCH' })
      if (res.ok) { addToast('success', `${user.email} updated`); load() }
      else addToast('error', 'Failed to update role')
    } else if (action === 'reset-password') {
      if (!confirm(`Force password reset for ${user.email}? They will need to set a new password on next login.`)) return
      const res = await apiFetch(`/api/admin/users/${user.id}/force-password-reset`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { temporaryPassword: string }
        addToast('success', `Password reset forced for ${user.email}`)
        alert(`Temporary password for ${user.email}:\n\n${data.temporaryPassword}\n\nShare this with the user. They must change it on next login.`)
        load()
      } else addToast('error', 'Failed to reset password')
    }
  }

  // Note: filtering is now done server-side; tabs counts are approximate (current page only)
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'admin',   label: 'Admin' },
    { key: 'regular', label: 'Regular' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Users</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{users.length} registered {users.length === 1 ? 'user' : 'users'}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
          <input type="text" placeholder="Search email or username…" value={query} onChange={e => setQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 rounded-lg"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          {tabs.map(({ key, label }, idx) => (
            <button key={key} onClick={() => { setFilter(key); setPage(0) }}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: filter === key ? 'rgba(245,158,11,0.12)' : 'transparent',
                color: filter === key ? '#f59e0b' : 'var(--color-muted)',
                borderRight: idx < tabs.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              {['User', 'Storage', 'Limit', 'Files', 'Joined', ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-muted)', background: 'var(--color-surface)' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-muted)', background: 'var(--color-surface)' }}>No users found.</td></tr>
            ) : users.map((u, i) => {
              const pct = u.storageLimitBytes > 0 ? (u.storageUsedBytes / u.storageLimitBytes) * 100 : 0
              const color = barColor(pct)
              const isSelf = u.email === selfEmail

              return (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-surface)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm truncate max-w-[180px]" style={{ color: 'var(--color-text)' }}>{u.email}</span>
                          {u.username && (
                            <span className="text-xs px-1.5 py-px rounded font-mono" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>@{u.username}</span>
                          )}
                          {u.admin && (
                            <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-px rounded font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                              <ShieldCheck size={9} /> admin
                            </span>
                          )}
                          {isSelf && <span className="text-xs px-1.5 py-px rounded" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>you</span>}
                        </div>
                        {u.passwordChangeRequired && <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>Password change required</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                      <span className="text-xs font-mono shrink-0" style={{ color }}>{pct.toFixed(0)}%</span>
                    </div>
                    <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{fmtMB(u.storageUsedBytes)}</p>
                  </td>
                  <td className="px-4 py-3"><StorageLimitCell user={u} onUpdated={load} /></td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--color-muted)' }}>{u.fileCount}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <ActionMenu user={u} isSelf={isSelf} onAction={action => handleAction(u, action)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg transition-all"
              style={{
                background: page === 0 ? 'var(--color-surface-2)' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: page === 0 ? 'var(--color-muted)' : 'var(--color-text)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}>
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-lg transition-all"
              style={{
                background: page === totalPages - 1 ? 'var(--color-surface-2)' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: page === totalPages - 1 ? 'var(--color-muted)' : 'var(--color-text)',
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
              }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
