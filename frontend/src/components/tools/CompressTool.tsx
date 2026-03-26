import { useRef, useState } from 'react'
import { UploadCloud, FileText, Download, Loader2 } from 'lucide-react'

interface Level {
  id: string
  label: string
  description: string
  detail: string
}

const LEVELS: Level[] = [
  { id: 'screen',   label: 'Screen',   description: 'Smallest file',   detail: '72 DPI — ideal for on-screen viewing and email' },
  { id: 'ebook',    label: 'eBook',    description: 'Balanced',         detail: '150 DPI — good quality at a moderate size' },
  { id: 'printer',  label: 'Printer',  description: 'High quality',     detail: '300 DPI — suitable for desktop printing' },
  { id: 'prepress', label: 'Prepress', description: 'Maximum quality',  detail: '300+ DPI with colour profiles — for professional print' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function CompressTool() {
  const [file, setFile]     = useState<File | null>(null)
  const [level, setLevel]   = useState('ebook')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Slider position ↔ level id
  const sliderIndex = LEVELS.findIndex((l) => l.id === level)
  const activeLevel = LEVELS[sliderIndex]

  function handleFile(f: File) {
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return }
    setFile(f)
    setError(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleCompress() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('level', level)

    try {
      const res = await fetch('/api/v1/compress', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Server error ${res.status}`)
      }

      const blob = await res.blob()
      const savings = file.size - blob.size
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'compressed.pdf'
      a.click()
      URL.revokeObjectURL(url)

      if (savings > 0) {
        const pct = ((savings / file.size) * 100).toFixed(1)
        setError(`✓ Saved ${formatBytes(savings)} (${pct}% reduction)`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.')
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = error?.startsWith('✓')

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Compress PDF</h2>
        <p className="text-slate-400 text-sm">Reduce file size using Ghostscript. Choose your quality/size trade-off.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700
                   bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl p-8
                   cursor-pointer transition-colors"
      >
        {file ? (
          <>
            <FileText size={28} className="text-green-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)} — click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a PDF, or <span className="text-green-400">browse</span>
            </p>
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }} />
      </div>

      {/* Quality slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-slate-300">Compression level</label>
          <span className="text-sm font-medium text-green-400">{activeLevel.label}</span>
        </div>

        <input
          type="range"
          min={0} max={LEVELS.length - 1}
          value={sliderIndex}
          onChange={(e) => setLevel(LEVELS[Number(e.target.value)].id)}
          className="w-full accent-green-500 cursor-pointer"
        />

        <div className="flex justify-between text-xs text-slate-600">
          {LEVELS.map((l) => <span key={l.id}>{l.label}</span>)}
        </div>

        {/* Active level card */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg px-4 py-3">
          <p className="text-sm text-white font-medium">{activeLevel.label}
            <span className="ml-2 text-xs text-slate-500 font-normal">— {activeLevel.description}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{activeLevel.detail}</p>
        </div>
      </div>

      {error && (
        <p className={`text-sm rounded-lg px-4 py-3 border ${
          isSuccess
            ? 'text-green-400 bg-green-500/10 border-green-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
        }`}>
          {error}
        </p>
      )}

      <button
        onClick={handleCompress} disabled={loading || !file}
        className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Compressing…</>
          : <><Download size={15} /> Compress & Download</>}
      </button>
    </div>
  )
}
