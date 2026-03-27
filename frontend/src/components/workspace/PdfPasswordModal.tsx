import { useEffect, useRef, useState } from 'react'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

interface PdfPasswordModalProps {
  open: boolean
  wrongPassword?: boolean
  onSubmit: (password: string) => void
  onCancel: () => void
}

export default function PdfPasswordModal({ open, wrongPassword, onSubmit, onCancel }: PdfPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setShow(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(password)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(4, 10, 20, 0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d1e35 0%, #0a1628 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Back button row */}
        <div className="px-4 pt-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-300 transition-colors group"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs">Dashboard</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-7 pt-5 pb-7">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <Lock size={20} style={{ color: '#fbbf24' }} />
          </div>

          <h2 className="text-base font-semibold text-white mb-1">
            Password protected
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter the document's open password to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: wrongPassword
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(255,255,255,0.09)',
                }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {wrongPassword && (
              <p className="text-xs" style={{ color: '#fca5a5' }}>
                Incorrect password. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={!password}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: 'rgba(251,191,36,0.15)',
                color: '#fde68a',
                border: '1px solid rgba(251,191,36,0.28)',
              }}
            >
              Open document
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
