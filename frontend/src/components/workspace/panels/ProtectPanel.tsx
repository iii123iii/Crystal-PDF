import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, ExternalLink, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface ProtectPanelProps {
  docId: string
  pdfPassword?: string | null
}

type Status = 'idle' | 'processing' | 'done' | 'error'

interface ResultDoc { id: number; originalName: string }

export default function ProtectPanel({ docId, pdfPassword }: ProtectPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [userPw, setUserPw] = useState('')
  const [ownerPw, setOwnerPw] = useState('')
  const [showOwner, setShowOwner] = useState(false)
  const [showUserPw, setShowUserPw] = useState(false)
  const [showOwnerPw, setShowOwnerPw] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleProtect() {
    if (!userPw) return
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/protect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPassword: userPw, ownerPassword: showOwner ? ownerPw : null, sourcePassword: pdfPassword ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Protect failed.')
      }
      const doc = await res.json() as ResultDoc
      setResult(doc)
      setStatus('done')
      addToast('success', `Saved "${doc.originalName}"`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setResult(null)
    setError(null)
    setUserPw('')
    setOwnerPw('')
  }

  const inputClass = `
    w-full bg-transparent rounded-lg px-3 py-2 text-sm text-slate-200
    placeholder-slate-600 outline-none transition-colors
    border border-white/[0.08] focus:border-red-400/40
  `

  return (
    <div className="p-4 flex flex-col gap-4">

      {status !== 'done' && (
        <>
          {/* User password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 tracking-wide">Open password</label>
            <div className="relative">
              <input
                type={showUserPw ? 'text' : 'password'}
                value={userPw}
                onChange={(e) => setUserPw(e.target.value)}
                placeholder="Required"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowUserPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showUserPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Owner password toggle */}
          <button
            onClick={() => setShowOwner((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors self-start"
          >
            {showOwner ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Set owner password (optional)
          </button>

          {showOwner && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500 tracking-wide">Owner password</label>
              <div className="relative">
                <input
                  type={showOwnerPw ? 'text' : 'password'}
                  value={ownerPw}
                  onChange={(e) => setOwnerPw(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showOwnerPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleProtect}
            disabled={!userPw || status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: 'rgba(248,113,113,0.12)',
              color: '#fca5a5',
              border: '1px solid rgba(248,113,113,0.22)',
            }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Encrypting…</>
            ) : (
              <><Lock size={14} />Protect PDF</>
            )}
          </button>
        </>
      )}

      {/* Done */}
      {status === 'done' && result && (
        <div
          className="rounded-lg p-3 flex flex-col gap-2.5"
          style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
        >
          <p className="text-xs font-medium" style={{ color: '#6ee7b7' }}>Saved successfully</p>
          <p className="text-xs text-slate-400 truncate">{result.originalName}</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/workspace/${result.id}`)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}
            >
              <ExternalLink size={11} />Open
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <RotateCcw size={11} />New
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
