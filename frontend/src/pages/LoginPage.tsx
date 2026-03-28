import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Gem } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const setAuth  = useAppStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please check your credentials.')
        return
      }

      setAuth(data.email ?? identifier, data.admin ?? false, data.passwordChangeRequired ?? false)
      if (data.passwordChangeRequired) {
        navigate('/force-change-password', { replace: true })
      } else if (data.admin) {
        navigate('/admin', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch {
      setError('Cannot reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06101a] flex">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0c1829]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Gem size={18} className="text-blue-400" />
            <span className="text-white font-semibold tracking-wide text-sm">Crystal PDF</span>
          </div>

          <h2 className="font-display text-4xl font-semibold text-white leading-tight">
            Welcome<br /><em className="not-italic text-blue-400">back.</em>
          </h2>
          <p className="mt-2 text-slate-400 text-sm">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
                Email or username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                placeholder="you@example.com or username"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/[0.07] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:bg-white/[0.07] transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex w-2/5 flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: '#06101a' }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Corner glow */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom left, rgba(59,130,246,0.13) 0%, transparent 70%)',
        }}
      />
      {/* Right edge separator */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-white/[0.06]" />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5">
        <Gem size={18} className="text-blue-400" />
        <span className="text-white/60 text-sm font-medium tracking-widest uppercase">Crystal PDF</span>
      </div>

      {/* Headline */}
      <div className="relative">
        <h1 className="font-display font-semibold text-white" style={{ fontSize: 'clamp(3rem, 4.5vw, 4.5rem)', lineHeight: 1.05 }}>
          Precision<br />
          PDF tools,<br />
          <em className="text-blue-400">simplified.</em>
        </h1>
        <p className="mt-5 text-slate-500 text-sm leading-relaxed max-w-[280px]">
          Upload once, transform endlessly. Your complete document workspace — always accessible, always secure.
        </p>

        <ul className="mt-8 space-y-3">
          {[
            'Full-document OCR & text extraction',
            'Merge, split, compress in seconds',
            'Your files, encrypted and private',
          ].map((feat) => (
            <li key={feat} className="flex items-center gap-3 text-sm text-slate-500">
              <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="relative">
        <span className="text-white/15 text-xs">Crystal PDF v2</span>
      </div>
    </div>
  )
}
