import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, Upload, X, ExternalLink, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { useToastStore } from '../../../store/useToastStore'

interface ImageToPdfPanelProps {
  docId: string
  onSuccess?: (doc: ResultDoc) => void
}

type Status = 'idle' | 'processing' | 'done' | 'error'
interface ResultDoc { id: number; originalName: string }

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageToPdfPanel({ docId: _docId, onSuccess }: ImageToPdfPanelProps) {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ResultDoc | null>(null)
  const [error, setError] = useState<string | null>(null)

  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const valid = Array.from(incoming).filter((f) => IMAGE_TYPES.includes(f.type))
    if (valid.length < incoming.length) {
      addToast('error', 'Only image files (JPG, PNG, WEBP, etc.) are accepted.')
    }
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size))
      return [...prev, ...valid.filter((f) => !names.has(f.name + f.size))]
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleConvert() {
    if (files.length === 0) return
    setStatus('processing')
    setError(null)
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      const res = await apiFetch('/api/documents/image-to-pdf', { method: 'POST', body: fd })
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
    setFiles([])
    setStatus('idle')
    setResult(null)
    setError(null)
  }

  if (status === 'done' && result) {
    return (
      <div className="p-4 flex flex-col gap-3">
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
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.08)'}`,
          background: dragging ? 'rgba(236,72,153,0.05)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <Upload size={18} style={{ color: dragging ? '#f472b6' : '#475569' }} />
        <p className="text-xs text-center" style={{ color: dragging ? '#f9a8d4' : '#64748b' }}>
          {dragging ? 'Drop images here' : <>Click or drag images<br /><span className="text-slate-600">JPG · PNG · WEBP · BMP</span></>}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-600 uppercase tracking-widest">
            {files.length} image{files.length !== 1 ? 's' : ''} — each becomes one page
          </span>
          <div
            className="rounded-lg overflow-hidden max-h-48 overflow-y-auto"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 text-xs"
                style={{
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: idx < files.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                }}
              >
                <span className="flex-1 truncate text-slate-400">{file.name}</span>
                <span className="shrink-0 text-slate-600 tabular-nums">{fmtSize(file.size)}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
        >
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleConvert}
        disabled={files.length === 0 || status === 'processing'}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
        style={{
          background: files.length > 0 ? 'rgba(236,72,153,0.14)' : 'rgba(236,72,153,0.07)',
          color: '#f9a8d4',
          border: '1px solid rgba(236,72,153,0.25)',
        }}
      >
        {status === 'processing' ? (
          <><Loader2 size={14} className="animate-spin" />Converting…</>
        ) : (
          <><FilePlus2 size={14} />Convert {files.length > 0 ? `${files.length} Image${files.length !== 1 ? 's' : ''}` : 'to PDF'}</>
        )}
      </button>
    </div>
  )
}
