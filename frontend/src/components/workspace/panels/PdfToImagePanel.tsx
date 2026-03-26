import { useState } from 'react'
import { FileImage, Loader2, Download, RotateCcw } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface PdfToImagePanelProps {
  docId: string
}

type Status = 'idle' | 'processing' | 'done' | 'error'
interface ResultDoc { id: number; originalName: string }

const DPI_OPTIONS = [
  { value: 72,  label: '72',  desc: 'Screen' },
  { value: 150, label: '150', desc: 'Default' },
  { value: 200, label: '200', desc: 'Sharp' },
  { value: 300, label: '300', desc: 'Print' },
]

export default function PdfToImagePanel({ docId }: PdfToImagePanelProps) {
  const addToast = useToastStore((s) => s.addToast)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [dpi, setDpi] = useState(150)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function handleConvert() {
    setStatus('processing')
    setError(null)
    try {
      const res = await apiFetch(`/api/documents/${docId}/tools/pdf-to-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, dpi }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? 'Conversion failed.')
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

  async function handleDownload() {
    if (!result) return
    setDownloading(true)
    try {
      const res = await apiFetch(`/api/documents/${result.id}/download`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.originalName
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
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
          {/* Format toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 tracking-wide">Format</label>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['png', 'jpg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="flex-1 py-2 text-xs font-medium transition-all"
                  style={{
                    background: format === f ? 'rgba(34,211,238,0.15)' : 'transparent',
                    color: format === f ? '#67e8f9' : '#64748b',
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* DPI preset buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 tracking-wide">Resolution (DPI)</label>
            <div className="grid grid-cols-4 gap-1">
              {DPI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDpi(opt.value)}
                  className="flex flex-col items-center py-2 rounded-lg transition-all"
                  style={{
                    background: dpi === opt.value ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.03)',
                    border: dpi === opt.value ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xs font-medium tabular-nums" style={{ color: dpi === opt.value ? '#67e8f9' : '#64748b' }}>
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-slate-700">{opt.desc}</span>
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
            onClick={handleConvert}
            disabled={status === 'processing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'rgba(34,211,238,0.12)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.22)' }}
          >
            {status === 'processing' ? (
              <><Loader2 size={14} className="animate-spin" />Converting…</>
            ) : (
              <><FileImage size={14} />Convert to Images</>
            )}
          </button>
        </>
      )}

      {status === 'done' && result && (
        <div
          className="rounded-lg p-3 flex flex-col gap-2.5"
          style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
        >
          <p className="text-xs font-medium" style={{ color: '#6ee7b7' }}>Conversion complete</p>
          <p className="text-xs text-slate-400 truncate">{result.originalName}</p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}
            >
              {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              Download ZIP
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
