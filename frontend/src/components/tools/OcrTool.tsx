import { useRef, useState } from 'react'
import { UploadCloud, FileText, Download, Loader2, ChevronDown } from 'lucide-react'

interface Language {
  code: string
  label: string
}

const LANGUAGES: Language[] = [
  { code: 'eng',     label: 'English' },
  { code: 'fra',     label: 'French' },
  { code: 'deu',     label: 'German' },
  { code: 'spa',     label: 'Spanish' },
  { code: 'ita',     label: 'Italian' },
  { code: 'por',     label: 'Portuguese' },
  { code: 'rus',     label: 'Russian' },
  { code: 'ara',     label: 'Arabic' },
  { code: 'chi_sim', label: 'Chinese (Simplified)' },
  { code: 'chi_tra', label: 'Chinese (Traditional)' },
  { code: 'jpn',     label: 'Japanese' },
  { code: 'kor',     label: 'Korean' },
  { code: 'hin',     label: 'Hindi' },
  { code: 'nld',     label: 'Dutch' },
  { code: 'pol',     label: 'Polish' },
  { code: 'tur',     label: 'Turkish' },
]

export default function OcrTool() {
  const [file, setFile]         = useState<File | null>(null)
  const [language, setLanguage] = useState('eng')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
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

  async function handleOcr() {
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)

    try {
      const res = await fetch('/api/v1/ocr', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Server error ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ocr.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed.')
    } finally {
      setLoading(false)
    }
  }

  const selectedLabel = LANGUAGES.find((l) => l.code === language)?.label ?? language

  return (
    <div className="max-w-lg mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">OCR PDF</h2>
        <p className="text-slate-400 text-sm">
          Make a scanned PDF searchable by running Tesseract OCR over every page.
        </p>
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
            <FileText size={28} className="text-orange-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a scanned PDF, or <span className="text-orange-400">browse</span>
            </p>
          </>
        )}
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }} />
      </div>

      {/* Language dropdown */}
      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Document language</label>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full appearance-none bg-slate-800/60 border border-slate-700/60 rounded-lg
                       px-4 py-2.5 pr-10 text-sm text-white focus:outline-none
                       focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-colors cursor-pointer"
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        <p className="text-slate-600 text-xs mt-1">
          Selected: <span className="text-slate-400">{selectedLabel}</span>
          {' · '}Language packs must be installed in Tesseract.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        onClick={handleOcr} disabled={loading || !file}
        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Running OCR…</>
          : <><Download size={15} /> Run OCR & Download</>}
      </button>
    </div>
  )
}
