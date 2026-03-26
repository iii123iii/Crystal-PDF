import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minimize2, Loader2, ExternalLink, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface CompressPanelProps {
  docId: string
}

type Level = 'screen' | 'ebook' | 'printer' | 'prepress'
type Status = 'idle' | 'processing' | 'done' | 'error'

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'screen', label: 'Screen', desc: 'Smallest file, 72 dpi' },
  { value: 'ebook', label: 'eBook', desc: 'Balanced, 150 dpi' },
  { value: 'printer', label: 'Printer', desc: 'High quality, 300 dpi' },
  { value: 'prepress', label: 'Prepress', desc: 'Maximum quality' },
]

interface ResultDoc { id: number; originalName: string }

export default function CompressPanel({ docId }: CompressPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [level, setLevel] = useState<Level>('ebook')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCompress() {
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Compression failed.')
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
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      {status !== 'done' && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 tracking-wide">Quality level</label>
            <div className="flex flex-col gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
                  style={{
                    background: level === l.value ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.03)',
                    border: level === l.value
                      ? '1px solid rgba(52,211,153,0.28)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: level === l.value ? '#6ee7b7' : '#94a3b8' }}
                  >
                    {l.label}
                  </span>
                  <span className="text-xs text-slate-600">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {status === 'error' && error && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleCompress}
            disabled={status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.22)' }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Compressing…</>
            ) : (
              <><Minimize2 size={14} />Compress PDF</>
            )}
          </button>
        </>
      )}

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
