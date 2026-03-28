import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileStack, Loader2, ExternalLink, RotateCcw, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface MergePanelProps {
  docId: string
  docName: string
  pdfPassword?: string | null
  onSuccess?: (doc: ResultDoc) => void
}

interface DocItem {
  id: number
  originalName: string
  sizeBytes: number
}

type Status = 'idle' | 'processing' | 'done' | 'error'
interface ResultDoc { id: number; originalName: string }

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MergePanel({ docId, docName, pdfPassword, onSuccess }: MergePanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/documents/my-files')
      .then((r) => r.json())
      .then((data: DocItem[]) => {
        // Exclude current document and non-PDF files
        setDocs(data.filter((d) => String(d.id) !== docId && d.originalName.toLowerCase().endsWith('.pdf')))
      })
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false))
  }, [docId])

  function toggleDoc(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleMerge() {
    if (selected.size === 0) return
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherDocumentIds: Array.from(selected), sourcePassword: pdfPassword ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Merge failed.')
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
    setSelected(new Set())
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {status !== 'done' && (
        <>
          {/* Current doc (primary) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">Base document</span>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-xs text-slate-300 truncate">{docName}</span>
            </div>
          </div>

          {/* Document picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
              Append documents
              {selected.size > 0 && (
                <span className="ml-2 text-blue-400">{selected.size} selected</span>
              )}
            </span>

            {loadingDocs ? (
              <div className="flex items-center gap-2 py-4 justify-center text-slate-600">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : docs.length === 0 ? (
              <div className="flex items-center gap-2 py-4 justify-center text-slate-600">
                <AlertCircle size={14} />
                <span className="text-xs">No other PDFs in your library</span>
              </div>
            ) : (
              <div
                className="flex flex-col rounded-lg overflow-hidden max-h-52 overflow-y-auto"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {docs.map((doc, idx) => {
                  const isSelected = selected.has(doc.id)
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-left transition-all w-full"
                      style={{
                        background: isSelected ? 'rgba(96,165,250,0.10)' : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderBottom: idx < docs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        className="shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center transition-all"
                        style={{
                          background: isSelected ? '#60a5fa' : 'transparent',
                          border: isSelected ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        {isSelected && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs truncate" style={{ color: isSelected ? '#93c5fd' : '#94a3b8' }}>
                          {doc.originalName}
                        </span>
                        <span className="block text-[10px] text-slate-700">{fmtSize(doc.sizeBytes)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
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
            onClick={handleMerge}
            disabled={selected.size === 0 || status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: selected.size > 0 ? 'rgba(96,165,250,0.14)' : 'rgba(96,165,250,0.07)',
              color: '#93c5fd',
              border: '1px solid rgba(96,165,250,0.22)',
            }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Merging…</>
            ) : (
              <><FileStack size={14} />Merge {selected.size > 0 ? `+${selected.size} Doc${selected.size !== 1 ? 's' : ''}` : 'Documents'}</>
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
