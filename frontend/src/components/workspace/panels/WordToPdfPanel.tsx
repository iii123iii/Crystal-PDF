import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, ExternalLink, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface WordToPdfPanelProps {
  docId: string
  docName: string
  onSuccess?: (doc: ResultDoc) => void
}

type Status = 'idle' | 'processing' | 'done' | 'error'
interface ResultDoc { id: number; originalName: string }

export default function WordToPdfPanel({ docId, docName, onSuccess }: WordToPdfPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ext = docName.split('.').pop()?.toLowerCase() ?? ''
  const isOffice = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt'].includes(ext)

  async function handleConvert() {
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/word-to-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Conversion failed.')
      }
      const doc = await res.json() as ResultDoc
      setResult(doc)
      setStatus('done')
      addToast('success', `Saved "${doc.originalName}"`)
      onSuccess?.(doc)
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
          {/* Source file info */}
          <div
            className="rounded-lg px-3 py-3 flex items-start gap-2.5"
            style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}
          >
            <FileText size={14} className="shrink-0 mt-0.5" style={{ color: '#a5b4fc' }} />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#a5b4fc' }}>{docName}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
                {isOffice ? 'Will be converted using LibreOffice' : 'Unsupported format'}
              </p>
            </div>
          </div>

          {!isOffice && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
            >
              This file type may not be supported. Expected .docx, .xlsx, .pptx, or .odt.
            </div>
          )}

          {status === 'error' && error && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(129,140,248,0.12)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.22)' }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Converting…</>
            ) : (
              <><FileText size={14} />Convert to PDF</>
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
              <ExternalLink size={11} />Open PDF
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
