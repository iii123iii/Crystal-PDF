import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, MousePointerClick, CheckSquare, Square, Loader2, ExternalLink, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface SplitPanelProps {
  docId: string
  totalPages: number
  selectedPages: Set<number>
  onSelectAll: () => void
  onClearAll: () => void
  pdfPassword?: string | null
}

type Status = 'idle' | 'processing' | 'done' | 'error'

interface ResultDoc {
  id: number
  originalName: string
}

export default function SplitPanel({ docId, totalPages, selectedPages, onSelectAll, onClearAll, pdfPassword }: SplitPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  const count = selectedPages.size

  async function handleExtract() {
    if (count === 0) return
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: Array.from(selectedPages).sort((a, b) => a - b), sourcePassword: pdfPassword ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Split failed.')
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
    onClearAll()
  }

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Instruction */}
      <div
        className="flex items-start gap-2.5 rounded-lg p-3"
        style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}
      >
        <MousePointerClick size={14} className="shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#c4b5fd' }}>
          Click pages in the viewer to select them. Selected pages will be extracted into a new document.
        </p>
      </div>

      {/* Selection stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 tabular-nums">
          {count === 0 ? 'No pages selected' : `${count} of ${totalPages} page${count !== 1 ? 's' : ''} selected`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onSelectAll}
            title="Select all"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-1.5 py-1 rounded hover:bg-white/[0.05]"
          >
            <CheckSquare size={12} />
            All
          </button>
          <button
            onClick={onClearAll}
            title="Clear selection"
            disabled={count === 0}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors px-1.5 py-1 rounded hover:bg-white/[0.05] disabled:hover:bg-transparent"
          >
            <Square size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Selected pages pills */}
      {count > 0 && count <= 30 && (
        <div className="flex flex-wrap gap-1">
          {Array.from(selectedPages).sort((a, b) => a - b).map((n) => (
            <span
              key={n}
              className="text-xs px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              {n}
            </span>
          ))}
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

      {/* Done state */}
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
              <ExternalLink size={11} />
              Open
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <RotateCcw size={11} />
              New
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      {status !== 'done' && (
        <button
          onClick={handleExtract}
          disabled={count === 0 || status === 'processing'}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{
            background: count > 0 && status !== 'processing' ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.08)',
            color: '#c4b5fd',
            border: '1px solid rgba(167,139,250,0.25)',
          }}
        >
          {status === 'processing' ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Extracting…
            </>
          ) : (
            <>
              <Scissors size={14} />
              Extract {count > 0 ? `${count} Page${count !== 1 ? 's' : ''}` : 'Pages'}
            </>
          )}
        </button>
      )}
    </div>
  )
}
