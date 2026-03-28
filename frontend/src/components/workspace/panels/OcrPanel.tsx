import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanText, Loader2, ExternalLink, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface OcrPanelProps {
  docId: string
  pdfPassword?: string | null
  onSuccess?: (doc: ResultDoc) => void
}

type Status = 'idle' | 'processing' | 'done' | 'error'

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'deu', label: 'German' },
  { code: 'fra', label: 'French' },
  { code: 'spa', label: 'Spanish' },
  { code: 'ita', label: 'Italian' },
  { code: 'por', label: 'Portuguese' },
  { code: 'rus', label: 'Russian' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'ara', label: 'Arabic' },
]

interface ResultDoc { id: number; originalName: string }

export default function OcrPanel({ docId, pdfPassword, onSuccess }: OcrPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [language, setLanguage] = useState('eng')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOcr() {
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, sourcePassword: pdfPassword ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'OCR failed.')
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 tracking-wide">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-colors cursor-pointer"
              style={{ background: '#0f1f35', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} style={{ background: '#0f1f35' }}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.15)', color: '#fed7aa' }}
          >
            OCR renders every page to an image and runs Tesseract. Large documents may take a minute.
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
            onClick={handleOcr}
            disabled={status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(251,146,60,0.12)', color: '#fdba74', border: '1px solid rgba(251,146,60,0.22)' }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Running OCR…</>
            ) : (
              <><ScanText size={14} />Apply OCR</>
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
