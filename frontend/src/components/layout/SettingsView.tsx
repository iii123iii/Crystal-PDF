import { useState } from 'react'
import { User, Lock, Loader2, CheckCircle } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import { useToastStore } from '../../store/useToastStore'

export default function SettingsView() {
  const userEmail = useAppStore((s) => s.userEmail)
  const addToast = useToastStore((s) => s.addToast)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const mismatch = newPw && confirmPw && newPw !== confirmPw
  const canSubmit = currentPw && newPw && confirmPw && !mismatch

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
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
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

  return (
    <div className="max-w-2xl mx-auto w-full px-8 py-10 space-y-8">

      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences.</p>
      </div>

      {/* Account section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <User size={13} className="text-slate-500" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Account</span>
        </div>
        <div className="px-5 py-4" style={{ background: '#0d1829' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-blue-300 shrink-0 select-none"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              {userEmail?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{userEmail}</p>
              <p className="text-xs text-slate-600 mt-0.5">Email address</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Lock size={13} className="text-slate-500" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Change password</span>
        </div>
        <div className="px-5 py-5" style={{ background: '#0d1829' }}>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: mismatch ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              />
              {mismatch && (
                <p className="text-xs" style={{ color: '#fca5a5' }}>Passwords do not match.</p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  background: saved ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.14)',
                  color: saved ? '#6ee7b7' : '#93c5fd',
                  border: saved ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(96,165,250,0.22)',
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
      </div>
    </div>
  )
}
