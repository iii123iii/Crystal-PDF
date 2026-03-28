import { useState, useEffect } from 'react'
import { User, Lock, Loader2, CheckCircle, Trash2, AlertTriangle, HardDrive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import { useToastStore } from '../../store/useToastStore'

function barColor(pct: number): string {
  if (pct > 90) return '#ef4444'
  if (pct > 70) return '#f59e0b'
  return '#3b82f6'
}

function fmtMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SettingsView() {
  const userEmail  = useAppStore((s) => s.userEmail)
  const clearAuth  = useAppStore((s) => s.clearAuth)
  const addToast   = useToastStore((s) => s.addToast)
  const navigate   = useNavigate()

  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePw, setDeletePw]   = useState('')
  const [deleting, setDeleting]   = useState(false)

  // Storage
  const [storage, setStorage] = useState<{ usedBytes: number; limitBytes: number } | null>(null)

  useEffect(() => {
    apiFetch('/api/auth/storage')
      .then(r => r.json())
      .then(setStorage)
      .catch(console.error)
  }, [])

  const mismatch  = newPw && confirmPw && newPw !== confirmPw
  const canSubmit = currentPw && newPw && confirmPw && !mismatch

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!deletePw) return
    setDeleting(true)
    try {
      const res = await apiFetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePw }),
      })
      if (res.ok) {
        clearAuth()
        navigate('/login', { replace: true })
      } else {
        const data = await res.json().catch(() => ({}))
        addToast('error', (data as { error?: string }).error ?? 'Could not delete account.')
        setDeleting(false)
      }
    } catch {
      addToast('error', 'Could not reach the server.')
      setDeleting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (res.ok) {
        setSaved(true)
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        addToast('success', 'Password updated.')
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        addToast('error', (data as { error?: string }).error ?? 'Could not update password.')
      }
    } catch {
      addToast('error', 'Could not reach the server.')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    transition: 'border-color 150ms',
  }

  const storagePct = storage && storage.limitBytes > 0 ? (storage.usedBytes / storage.limitBytes) * 100 : 0
  const storageColor = barColor(storagePct)

  return (
    <div className="max-w-xl mx-auto w-full px-8 py-8 space-y-6">

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
          Manage your account.
        </p>
      </div>

      {/* Storage */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}
        >
          <HardDrive size={12} style={{ color: 'var(--color-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Storage</span>
        </div>
        <div className="px-5 py-5" style={{ background: 'var(--color-surface)' }}>
          {storage ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtMB(storage.usedBytes)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    used of {fmtMB(storage.limitBytes)}
                  </p>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{ background: `${storageColor}18`, color: storageColor }}
                >
                  {storagePct.toFixed(1)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(storagePct, 100)}%`, background: `linear-gradient(90deg, ${storageColor}, ${storageColor}cc)` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>0 MB</span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{fmtMB(storage.limitBytes)}</span>
              </div>
              {storagePct > 90 && (
                <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={12} /> Storage almost full. Delete unused files to free space.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <Loader2 size={13} className="animate-spin" /> Loading…
            </div>
          )}
        </div>
      </section>

      {/* Account */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: 'var(--color-surface-2)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <User size={12} style={{ color: 'var(--color-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Account
          </span>
        </div>
        <div className="px-5 py-4" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 select-none"
              style={{
                background: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
              }}
            >
              {userEmail?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {userEmail}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Email address</p>
            </div>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >

        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: 'var(--color-surface-2)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Lock size={12} style={{ color: 'var(--color-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Change password
          </span>
        </div>
        <div className="px-5 py-5" style={{ background: 'var(--color-surface)' }}>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {[
              { label: 'Current password', val: currentPw, set: setCurrentPw, complete: 'current-password' },
              { label: 'New password',     val: newPw,     set: setNewPw,     complete: 'new-password' },
              { label: 'Confirm new password', val: confirmPw, set: setConfirmPw, complete: 'new-password' },
            ].map(({ label, val, set, complete }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  autoComplete={complete}
                  style={{
                    ...fieldStyle,
                    borderColor: (label.includes('Confirm') && mismatch)
                      ? 'rgba(248,113,113,0.5)'
                      : 'var(--color-border)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
                {label.includes('Confirm') && mismatch && (
                  <p className="text-xs" style={{ color: '#f87171' }}>Passwords do not match.</p>
                )}
              </div>
            ))}

            <div className="pt-1">
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  background: saved ? 'rgba(52,211,153,0.12)' : 'var(--color-accent-muted)',
                  color:      saved ? '#34d399' : 'var(--color-accent)',
                  border:     saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--color-accent)',
                }}
              >
                {saving ? (
                  <><Loader2 size={13} className="animate-spin" />Saving…</>
                ) : saved ? (
                  <><CheckCircle size={13} />Password updated</>
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Danger zone */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,0.06)',
            borderBottom: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <AlertTriangle size={12} style={{ color: '#ef4444' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Danger zone
          </span>
        </div>
        <div className="px-5 py-5" style={{ background: 'var(--color-surface)' }}>
          {!showDeleteConfirm ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Delete account
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Permanently delete your account and all uploaded files. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <Trash2 size={12} />
                Delete account
              </button>
            </div>
          ) : (
            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Enter your password to confirm account deletion. All files will be permanently deleted.
              </p>
              <input
                type="password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                autoFocus
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: 'var(--color-text)',
                  borderRadius: 8,
                  padding: '0.5rem 0.75rem',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!deletePw || deleting}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                  }}
                >
                  {deleting ? <><Loader2 size={12} className="animate-spin" />Deleting…</> : <><Trash2 size={12} />Confirm delete</>}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeletePw('') }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: 'var(--color-muted)', background: 'var(--color-surface-2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
