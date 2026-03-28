import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { useAppStore } from '../store/useAppStore'
import { useToastStore } from '../store/useToastStore'

export default function ForcePasswordChangePage() {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showNew, setShowNew]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const setAuth    = useAppStore((s) => s.setAuth)
  const userEmail  = useAppStore((s) => s.userEmail)
  const isAdmin    = useAppStore((s) => s.isAdmin)
  const addToast   = useToastStore((s) => s.addToast)
  const navigate   = useNavigate()

  const mismatch  = newPw && confirmPw && newPw !== confirmPw
  const canSubmit = currentPw && newPw.length >= 8 && confirmPw && !mismatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (res.ok) {
        setAuth(userEmail!, isAdmin, false)
        addToast('success', 'Password updated. Welcome!')
        navigate(isAdmin ? '/admin' : '/dashboard', { replace: true })
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Failed to update password.')
      }
    } catch {
      setError('Cannot reach the server.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 150ms',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0b1120' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: '#111827',
          border: '1px solid rgba(245,158,11,0.25)',
          boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
        />

        <div className="p-8">
          {/* Warning icon */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <ShieldAlert size={28} style={{ color: '#f59e0b' }} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center mb-1" style={{ color: '#f1f5f9' }}>
            Change your password
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: '#94a3b8' }}>
            You're using the default credentials. You must set a new password before continuing.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Current password
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  style={{ ...inputStyle, paddingLeft: '2.2rem' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                New password
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {newPw && newPw.length < 8 && (
                <p className="text-xs" style={{ color: '#f59e0b' }}>At least 8 characters required</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
                style={{
                  ...inputStyle,
                  borderColor: mismatch ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = mismatch ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = mismatch ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
              />
              {mismatch && <p className="text-xs" style={{ color: '#f87171' }}>Passwords don't match</p>}
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 mt-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Updating…</>
                : 'Set new password & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
