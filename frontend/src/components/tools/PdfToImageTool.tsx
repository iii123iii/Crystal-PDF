import { useRef, useState } from 'react'
import { UploadCloud, FileText, Download, Loader2 } from 'lucide-react'

const DPI_OPTIONS = [72, 96, 150, 200, 300]

export default function PdfToImageTool() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'png' | 'jpg'>('png')
  const [dpi, setDpi] = useState(150)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  async function handleConvert() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    formData.append('dpi', String(dpi))

    try {
      const res = await fetch('/api/v1/convert/pdf-to-image', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pages.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">PDF to Image</h2>
        <p className="text-slate-400 text-sm">
          Convert each page to a PNG or JPG image. Downloads as a ZIP archive.
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-700
                   bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50 rounded-xl p-10
                   cursor-pointer transition-colors duration-200"
      >
        {file ? (
          <>
            <FileText size={28} className="text-cyan-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a PDF, or <span className="text-cyan-400">browse</span>
            </p>
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }} />
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-slate-400 mb-2">Format</p>
          <div className="flex gap-2">
            {(['png', 'jpg'] as const).map((f) => (
              <button key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                  ${format === f
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Resolution (DPI)</p>
          <div className="flex gap-2 flex-wrap">
            {DPI_OPTIONS.map((d) => (
              <button key={d}
                onClick={() => setDpi(d)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
                  ${dpi === d
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleConvert}
        disabled={loading || !file}
        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Converting…</>
          : <><Download size={15} /> Convert & Download ZIP</>}
      </button>
    </div>
  )
}
