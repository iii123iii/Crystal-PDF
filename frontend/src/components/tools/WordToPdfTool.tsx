import { useRef, useState } from 'react'
import { UploadCloud, FileText, Download, Loader2 } from 'lucide-react'

const ACCEPTED_TYPES: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-powerpoint': '.ppt',
}
const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',')
const EXT_LIST = '.doc, .docx, .xls, .xlsx, .ppt, .pptx'

export default function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (!ACCEPTED_TYPES[f.type]) {
      setError(`Unsupported file type. Accepted formats: ${EXT_LIST}`)
      return
    }
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

    try {
      const res = await fetch('/api/v1/convert/word-to-pdf', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Server error ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name.replace(/\.[^.]+$/, '') + '.pdf'
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
        <h2 className="text-2xl font-bold text-white mb-1">Word / Excel to PDF</h2>
        <p className="text-slate-400 text-sm">
          Convert Office documents to PDF using LibreOffice. Accepts {EXT_LIST}.
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
            <FileText size={28} className="text-indigo-400" />
            <p className="text-sm text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-500">Click or drop to replace</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a document, or <span className="text-indigo-400">browse</span>
            </p>
            <p className="text-xs text-slate-500">{EXT_LIST}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleConvert}
        disabled={loading || !file}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700
                   disabled:text-slate-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Converting…</>
          : <><Download size={15} /> Convert to PDF</>}
      </button>
    </div>
  )
}
